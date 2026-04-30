## Corrigir spinner infinito da aba Vendas no Marketing

### Diagnóstico

`useSalesRecords.ts` (linha 72) faz embed PostgREST `pdvs(name)`, mas `sales_records` **não tem foreign key declarada** para `pdvs.id` (confirmado no schema). Sem FK, o embed retorna erro de relação. O React Query faz 3 retries com backoff exponencial — durante esse tempo `isLoading` permanece `true`, dando a aparência de "spinner infinito". O early-return em `SalesRecordsTab` linha 111 (`if (isLoading) return <Loader/>`) impede ver qualquer outro estado.

Não é problema de timeout por falta de filtro de PDV — `filterPdv` default `"all"` é tratado corretamente (apenas omite o `.eq` em vez de gerar query inválida). O problema raiz é a relação inexistente.

### Correção

Duas mudanças mínimas:

1. **Migration**: adicionar a FK `sales_records.pdv_id → pdvs.id` (consistente com o schema lógico do app — todo registro de venda já referencia um PDV via `pdv_id uuid NOT NULL`).
2. **`SalesRecordsTab.tsx`**: trocar o early-return do spinner por overlay/skeleton dentro do layout, para que filtros e botão "Nova Venda" continuem visíveis durante o loading. Também tratar erro do `useQuery` para mostrar mensagem em vez de spinner eterno.

### 1. Migration SQL

```sql
-- Garantir integridade: remover órfãos (defensivo, idealmente 0)
DELETE FROM public.sales_records sr
WHERE NOT EXISTS (SELECT 1 FROM public.pdvs p WHERE p.id = sr.pdv_id);

ALTER TABLE public.sales_records
  ADD CONSTRAINT sales_records_pdv_id_fkey
  FOREIGN KEY (pdv_id) REFERENCES public.pdvs(id) ON DELETE CASCADE;

-- Index para suportar a FK (já costuma existir, mas garantimos)
CREATE INDEX IF NOT EXISTS idx_sales_records_pdv_id ON public.sales_records(pdv_id);
```

### 2. Refactor `useSalesRecords.ts`

Expor `error` no retorno do hook:

```ts
const { data, isLoading, error } = useQuery({ ... });
// ...
return { records, isLoading, error, totalCount, ... };
```

### 3. Refactor `SalesRecordsTab.tsx` (linha 111)

Substituir o early-return por um estado dentro do layout:

```tsx
const { records, isLoading, error, totalCount, ... } = useSalesRecords(...);

// remover o bloco `if (isLoading) return <Loader/>`

// dentro do return, após os filtros:
{error ? (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <p className="text-sm text-destructive">Erro ao carregar vendas.</p>
    <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
  </div>
) : isLoading ? (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
) : records.length === 0 ? (
  <div className="text-center py-12 text-muted-foreground">
    <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
    <h3 className="text-lg font-medium">Nenhuma venda encontrada</h3>
  </div>
) : (
  /* tabela existente */
)}
```

### Validação

- Network: `GET /rest/v1/sales_records?...&select=...,pdvs(name)` retorna 200 com array de objetos contendo `pdvs: { name: ... }`.
- Aba Vendas em Marketing carrega registros (1741 no total) paginados.
- Filtros e botão continuam visíveis durante loading.
- Erro de rede mostra mensagem clara em vez de spinner eterno.
- Aba Vendas em Uploads continua funcionando (mesmo componente).

### Arquivos afetados

- Nova migration em `supabase/migrations/`.
- `src/hooks/useSalesRecords.ts` — expor `error`.
- `src/components/upload/SalesRecordsTab.tsx` — remover early-return, adicionar empty/error states inline.

### Riscos

- FK com `ON DELETE CASCADE`: se um PDV for deletado, suas vendas vão junto. Já é o comportamento esperado (vendas sem PDV não fazem sentido). RLS de `sales_records` já assume `pdv_id IN pdvs`.
- Migration roda `DELETE` defensivo de órfãos antes de criar a FK — risco mínimo se 0 órfãos (validar antes via `read_query`).