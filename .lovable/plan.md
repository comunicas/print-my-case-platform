
# Ativar `dataRange` no DateRangeFilter com Intervalo Real de Dados

## Objetivo

Passar `dataRange={{ min, max }}` para o `DateRangeFilter` no dashboard, de forma que:
- O indicador **"Dados: 15/01 - 19/02"** apareça mostrando o intervalo real de registros disponíveis
- O botão **"Ver tudo"** mude o filtro para cobrir todo o histórico disponível
- O calendário desabilite datas fora do intervalo de dados reais

## Diagnóstico

O `DateRangeFilter` tem toda a lógica já implementada (prop `dataRange`, `handleViewAll`, exibição condicional) — mas em `Index.tsx` o componente é chamado sem essa prop:

```tsx
// Index.tsx — atual (dataRange nunca passado)
<DateRangeFilter
  dateRange={dateRange}
  onDateRangeChange={setDateRange}
/>
```

O que falta é a **fonte de dados**: uma query leve que busca `MIN(payment_date)` e `MAX(payment_date)` de `sales_records`, respeitando os mesmos filtros de organização e PDV que o dashboard.

## Solução

### 1. Novo hook: `src/hooks/useDashboardDataRange.ts`

Hook leve e dedicado que faz **uma única query** na tabela `sales_records` para buscar os limites temporais dos dados. Recebe os mesmos parâmetros de filtro que `useDashboard`:

```typescript
interface UseDashboardDataRangeParams {
  selectedOrganizationId?: string | "all";
  selectedPdvId?: string | "all";
}

// Retorna:
interface DashboardDataRange {
  min: Date;   // payment_date mais antigo disponível
  max: Date;   // payment_date mais recente disponível
}
```

**Estratégia da query:**
- `SELECT payment_date FROM sales_records ORDER BY payment_date ASC LIMIT 1` para `min`
- `SELECT payment_date FROM sales_records ORDER BY payment_date DESC LIMIT 1` para `max`
- Aplica o mesmo filtro de `pdv_id` que o dashboard: se PDV específico selecionado, filtra por ele; se não, filtra pelos PDVs da organização
- `staleTime: 10min` (dados históricos mudam raramente)
- `enabled` apenas quando `profile?.id` ou `isSuperAdmin` estiver disponível

**Query exata (2 sub-queries paralelas):**

```typescript
const [minResult, maxResult] = await Promise.all([
  query.order("payment_date", { ascending: true }).limit(1).single(),
  query.order("payment_date", { ascending: false }).limit(1).single(),
]);
```

Retorna `undefined` se não houver dados.

### 2. Integração em `src/pages/Index.tsx`

Adicionar o hook e passar o resultado ao `DateRangeFilter`:

```tsx
// Import novo hook
import { useDashboardDataRange } from "@/hooks/useDashboardDataRange";

// Usar no componente (junto aos outros hooks)
const { dataRange } = useDashboardDataRange({
  selectedOrganizationId: selectedOrgId,
  selectedPdvId: selectedPdvId,
});

// Passar ao DateRangeFilter
<DateRangeFilter
  dateRange={dateRange}
  onDateRangeChange={setDateRange}
  dataRange={dataRange}    // ← nova prop
/>
```

O `dataRange` muda automaticamente quando o usuário troca de organização ou PDV, graças ao `queryKey` que inclui esses valores.

## Comportamento Resultante

| Situação | Exibição |
|---|---|
| Org com dados de Jan/2025 a Fev/2026 | "Dados: 01/01 - 19/02" + "Ver tudo" |
| PDV específico com dados apenas em Dez/2025 | "Dados: 01/12 - 31/12" + "Ver tudo" |
| Sem dados ainda | `dataRange = undefined` → sem indicador (comportamento atual) |
| Clique em "Ver tudo" | `dateRange` atualiza para `{ from: min, to: max }` |
| Calendário aberto | Datas antes de `min` e após `max` ficam desabilitadas |

## Detalhes Técnicos

### Lógica de filtro de PDV no novo hook

O hook precisa replicar exatamente a mesma lógica de escopo de PDV que `useDashboard`:

```
1. Se selectedPdvId !== "all" → filtra por pdv_id = selectedPdvId
2. Se userAllowedPdvIds !== null → filtra pelo conjunto permitido
3. Se não isSuperAdmin ou org selecionada → busca pdvs da org e filtra
4. Se isSuperAdmin sem org selecionada → sem filtro (todos os dados)
```

Para evitar duplicação, pode-se extrair essa lógica de resolução de `pdvIds` para uma função utilitária, ou simplesmente replicá-la no novo hook (mais simples para manter isolamento).

### Cache e performance

- `queryKey: ["dashboard-data-range", orgId, pdvId, isSuperAdmin, userAllowedPdvIds]`
- `staleTime: 10 * 60 * 1000` — invalida com novos uploads via `queryClient.invalidateQueries({ queryKey: ["dashboard-data-range"] })` já feito no `useUploads` (que invalida `["dashboard"]` — podemos adicionar `["dashboard-data-range"]` ao mesmo hook)
- A query é extremamente leve: apenas 2 linhas retornadas do banco

### Invalidação ao fazer upload

Em `useUploads.ts`, na `onSuccess` do `createUpload`, já é feita a invalidação:
```typescript
queryClient.invalidateQueries({ queryKey: ["uploads"] });
queryClient.invalidateQueries({ queryKey: ["dashboard"] });
```

Adicionar:
```typescript
queryClient.invalidateQueries({ queryKey: ["dashboard-data-range"] });
```

E também na callback do `process-spreadsheet` (já dentro do `.then()`):
```typescript
queryClient.invalidateQueries({ queryKey: ["dashboard-data-range"] });
```

## Arquivos a Modificar

| Arquivo | Tipo | Mudança |
|---|---|---|
| `src/hooks/useDashboardDataRange.ts` | **NOVO** | Hook que busca min/max de payment_date |
| `src/pages/Index.tsx` | Edição | Importar hook, passar `dataRange` ao DateRangeFilter |
| `src/hooks/useUploads.ts` | Edição | Invalidar `dashboard-data-range` após upload processado |

## O que NÃO muda

- `DateRangeFilter.tsx` — já está completo e funcional
- `useDashboard.ts` — sem alteração de lógica de queries
- Lógica de trends, KPIs, charts — zero impacto
- Testes existentes — nenhuma quebra de interface pública
- RLS/banco — sem migrações, query usa a tabela existente `sales_records` com as mesmas políticas de acesso

## Resultado Visual

```text
[Hoje] [7d] [30d] [90d] [Este mês] [Mês passado] [📅 ▾]
01/01 - 19/02 (50 dias) • Dados: 15/11 - 19/02  [Ver tudo]
                                  ↑ NOVO — aparece quando dataRange está disponível
```
