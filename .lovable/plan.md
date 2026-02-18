
# Checklist do Code Review — Estado Real Atual

## Resumo Executivo

Após leitura direta de todos os arquivos envolvidos no plano, o estado atual é:
- **6 de 12 itens IMPLEMENTADOS corretamente**
- **4 itens PARCIALMENTE implementados** (código corrigido mas deixou resíduos)
- **2 itens PENDENTES** (não foram implementados)

---

## Checklist Completo

### FASE 1 — Correções Críticas

---

**[IMPLEMENTADO] 1.1 Limite de anomalias R$ 500 → R$ 10.000 (edge function)**

`supabase/functions/process-spreadsheet/index.ts` linha 32-34:
```typescript
const ANOMALY_THRESHOLDS = {
  maxSingleAmount: 10000,
};
```
Correto. A edge function usa R$ 10.000.

---

**[PENDENTE - RESÍDUO] 1.1b — Constante e toast de anomalias ainda usam R$ 500**

Dois locais no front-end ainda referenciam o valor antigo:

**Arquivo 1:** `src/lib/constants.ts` linha 21:
```typescript
export const ANOMALY_VALUE_THRESHOLD = 500; // R$ acima deste valor é considerado anomalia
```

**Arquivo 2:** `src/hooks/useUploads.ts` linha 205:
```typescript
description: `${data.anomalyCount} transação(ões) com valores acima de R$ 500. Verifique os dados importados.`,
```

**Arquivo 3:** `src/lib/__tests__/constants.test.ts` linha 65-67:
```typescript
it('ANOMALY_VALUE_THRESHOLD deve ser R$ 500', () => {
  expect(ANOMALY_VALUE_THRESHOLD).toBe(500);
});
```

A constante `ANOMALY_VALUE_THRESHOLD` em `constants.ts` não é importada por nenhum arquivo funcional (apenas pelo teste) — foi provavelmente criada como referência mas nunca conectada à edge function. Resultado: a mensagem que o usuário vê no toast ainda diz "R$ 500", mesmo com o limite real sendo R$ 10.000. O teste também está quebrado (espera 500, mas o valor correto seria 10000).

**Correção necessária:**
- Atualizar `ANOMALY_VALUE_THRESHOLD` de `500` para `10000` em `constants.ts`
- Atualizar o toast em `useUploads.ts` para usar a constante ao invés de hardcode
- Atualizar o teste em `constants.test.ts` para refletir o novo valor

---

**[IMPLEMENTADO] 1.2 — Deduplicação do cálculo de anomalias**

`supabase/functions/process-spreadsheet/index.ts` linhas 874-876 e 924-925:
```typescript
// Reutiliza anomalias e contagem já calculadas no bloco de vendas acima
const uploadAnomalyCount = anomalySkipped;
// ...
const responseAnomalies: AnomalyRecord[] = detectedAnomalies;
```
Correto. O cálculo é feito uma vez, reutilizado em três lugares.

---

**[IMPLEMENTADO] 1.3 — Exclusão de upload limpa stock_history**

`src/hooks/useUploads.ts` linhas 270-279:
```typescript
const { error: historyDeleteError } = await supabase
  .from("stock_history")
  .delete()
  .eq("upload_id", uploadId);
```
Correto. Stock_history é limpo ao excluir upload de estoque.

---

**[IMPLEMENTADO] 1.4 — Filtro de cancelamentos em português no dashboard**

`src/hooks/useDashboard.ts` linha 145:
```typescript
.or("status.ilike.%cancelled%,status.ilike.%canceled%,status.ilike.%cancelado%");
```
Correto. Cobre os três formatos (EN, EN variação, PT).

---

### FASE 2 — Refatoração e Limpeza

---

**[IMPLEMENTADO] 2.1 — getSalesIndex duplicada removida de dashboardUtils**

`src/lib/dashboardUtils.ts` linha 5 e 337:
```typescript
import { getSalesIndex } from "./stockUtils"; // Importação correta
// ...
// getSalesIndex removida: usa a versão canônica de stockUtils.ts (sem duplicação)
```
Correto. A função duplicada foi removida e substituída pela importação.

---

**[IMPLEMENTADO] 2.2 — MAX_CAPACITY unificado**

`src/components/stock/ProductDetailModal.tsx` linha 11:
```typescript
import { MAX_CAPACITY } from '@/lib/stockTypes';
```
Correto. Agora importa de `stockTypes` (fonte canônica). Os demais arquivos que importam de `stockGridUtils` (SlotDetailModal, SlotStack, ProductSlotsList) também estão corretos porque `stockGridUtils` re-exporta de `stockTypes`:
```typescript
// stockGridUtils.ts linha 5
export { MAX_CAPACITY, STOCK_THRESHOLDS };
```
Sem conflito — todos apontam para o mesmo valor.

---

**[IMPLEMENTADO] 2.3 — Lógica de OUTROS no ingest-stock corrigida**

`supabase/functions/ingest-stock/index.ts` linhas 260-263:
```typescript
const brandRecords = (allPdvRecords ?? []).filter(r => {
  const recordBrand = extractBrand((r as { product_name: string }).product_name ?? "");
  return recordBrand === brand;
});
```
Correto. Agora filtra em memória com `extractBrand()`, evitando a query `ilike ""` que retornava todos os produtos.

---

### FASE 3 — UX e Performance

---

**[IMPLEMENTADO] 3.1 — Filtros de uploads server-side**

`src/hooks/useUploads.ts` linhas 75-103: filtros de `pdvId`, `type`, `status` e `search` (file_name + period) aplicados server-side via `.eq()` e `.or(ilike)`.

`src/pages/Uploads.tsx` linhas 80-85: filtros passados como parâmetros para o hook.

`useEffect` (linha 64-67): reseta para página 1 quando qualquer filtro muda.

Correto. Três problemas resolvidos em conjunto.

---

**[PENDENTE] 3.2 — Busca por PDV na página de Uploads tem comportamento inesperado**

Em `src/hooks/useUploads.ts` linhas 121-126, há um filtro client-side residual problemático:
```typescript
if (searchTerm) {
  const term = searchTerm.toLowerCase();
  uploads = uploads.filter((u) => u.pdv?.name?.toLowerCase().includes(term));
}
```

**O problema:** quando o usuário digita qualquer coisa no campo de busca, este filtro client-side **substitui** os resultados server-side em vez de complementá-los. A lógica atual funciona com `OR` (arquivo OU período server-side), mas o filtro client-side aplica um `AND` implícito (também precisa bater com o nome do PDV). Se o usuário buscar "TIETE", a query server-side retorna resultados com `file_name ilike %TIETE%` OU `period ilike %TIETE%` — mas então o filtro client-side filtra apenas os que têm `pdv.name` contendo "tiete". Se o arquivo se chama "REVENUE-TIETE.xlsx", ele vai retornar do banco pelo `file_name`, mas pode ser descartado pelo filtro client-side se `pdv.name` não contiver "tiete".

**Solução:** o filtro client-side deve ser aplicado com `OR` (não `AND`): mostrar o resultado se já passou no filtro server-side OU se o pdv.name bate com o termo. Como o server-side já filtrou, todos os resultados já passaram — o filtro client-side por pdv.name deveria ser um complemento `OR`, mas só executar quando o server-side não retornou nada (ou seja, quando não tem match de file_name/period).

**Correção necessária:**
Remover o filtro client-side redundante. A busca por nome de PDV pode ser feita via uma query com `IN` (buscar IDs de PDVs cujo nome bate e adicionar ao `or()` server-side), ou simplificar para aceitar que a busca textual atinge `file_name` e `period` (comportamento correto e documentado).

---

**[IMPLEMENTADO] 3.3 — Comentário de limitação em useProductAnalytics**

`src/hooks/useProductAnalytics.ts` linhas 40-44:
```typescript
// Buscar todas as vendas e filtrar client-side para matching exato por produto.
// O matching preciso usa filterSalesByProduct (normalização JS) porque ilike do Postgres
// não distingue "iPhone 14" de "iPhone 14 Pro Max".
// LIMITAÇÃO CONHECIDA: limite de 10.000 registros. Com volumes maiores, considerar
// pré-computar as métricas por produto em uma view ou função do banco.
```
Correto. Limitação documentada.

---

**[IMPLEMENTADO] 3.4 — Tooltip no filtro saleStatusFilter**

`src/components/stock/StockFilters.tsx` linhas 162-174:
```tsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Info className="h-4 w-4 text-muted-foreground cursor-help flex-shrink-0" />
    </TooltipTrigger>
    <TooltipContent side="top" className="max-w-xs">
      <p className="text-xs">
        <strong>Padrão: Concluídas.</strong> Filtra quais vendas são usadas para calcular o índice de vendas...
      </p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```
Correto. Ícone de informação com tooltip explicativo.

---

## Tabela Resumo

| # | Item | Status | Arquivo(s) |
|---|---|---|---|
| 1.1 | Limite anomalia edge function R$ 500 → R$ 10.000 | IMPLEMENTADO | process-spreadsheet/index.ts |
| 1.1b | Toast e constante front-end ainda dizem R$ 500 | PENDENTE | useUploads.ts, constants.ts, constants.test.ts |
| 1.2 | Deduplicar cálculo de anomalias | IMPLEMENTADO | process-spreadsheet/index.ts |
| 1.3 | Exclusão de upload limpa stock_history | IMPLEMENTADO | useUploads.ts |
| 1.4 | Filtro cancelamentos português no dashboard | IMPLEMENTADO | useDashboard.ts |
| 2.1 | getSalesIndex duplicada removida | IMPLEMENTADO | dashboardUtils.ts |
| 2.2 | MAX_CAPACITY unificado | IMPLEMENTADO | ProductDetailModal.tsx |
| 2.3 | Lógica OUTROS no ingest-stock | IMPLEMENTADO | ingest-stock/index.ts |
| 3.1 | Filtros uploads server-side + reset de página | IMPLEMENTADO | useUploads.ts, Uploads.tsx |
| 3.2 | Busca por PDV com filtro client-side conflitante | PENDENTE | useUploads.ts |
| 3.3 | Documentação limite 10.000 em useProductAnalytics | IMPLEMENTADO | useProductAnalytics.ts |
| 3.4 | Tooltip no filtro saleStatusFilter | IMPLEMENTADO | StockFilters.tsx |

---

## Itens Pendentes a Implementar

### Item 1 — Sincronizar constante e toast de anomalias com o limite real (R$ 10.000)

**Arquivos:** `src/lib/constants.ts`, `src/hooks/useUploads.ts`, `src/lib/__tests__/constants.test.ts`

Mudanças:
- `constants.ts`: alterar `ANOMALY_VALUE_THRESHOLD = 500` para `ANOMALY_VALUE_THRESHOLD = 10000`
- `useUploads.ts`: substituir o texto hardcoded `"R$ 500"` no toast pela constante importada: `` `${data.anomalyCount} transação(ões) com valores acima de R$ ${ANOMALY_VALUE_THRESHOLD.toLocaleString('pt-BR')}. Verifique os dados importados.` ``
- `constants.test.ts`: atualizar o teste para `expect(ANOMALY_VALUE_THRESHOLD).toBe(10000)`

### Item 2 — Corrigir filtro client-side de PDV na busca de uploads

**Arquivo:** `src/hooks/useUploads.ts` linhas 121-126

O filtro client-side atual usa `AND` implícito com os resultados server-side, tornando a busca incorreta quando o usuário digita o nome de um arquivo (ex: "REVENUE-TIETE") — o filtro client-side tenta também validar `pdv.name` e pode descartar resultados válidos.

Solução: remover o filtro client-side de `pdv.name` por completo. A busca server-side já cobre `file_name` e `period` com precisão. Para habilitar busca por PDV no futuro, implementar via subquery server-side (buscar IDs dos PDVs com nome matching e adicionar ao `or()`).
