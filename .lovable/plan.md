
# Eliminar Divisões Inversas: previousRevenue e previousTransactions

## Problema

Em `src/pages/Index.tsx`, as trends de Receita e Transações ainda calculam o valor anterior via divisão inversa:

```typescript
// FRÁGIL — se revenueChange = -100, resulta em divisão por zero (NaN)
const revenueTrend = calculateTrend(
  kpis.totalRevenue,
  kpis.totalRevenue / (1 + kpis.revenueChange / 100),  // ← instável
  dateRange.from,
  dateRange.to
);

const transactionsTrend = calculateTrend(
  kpis.transactions,
  kpis.transactions / (1 + kpis.transactionsChange / 100),  // ← instável
  dateRange.from,
  dateRange.to
);
```

## Causa Raiz

`calculateKPIs` em `dashboardUtils.ts` já calcula `previousRevenue` e `previousTransactions` internamente (linhas 389-391), mas a interface `KPIData` não os expõe — então `useDashboard` não os passa, forçando `Index.tsx` a reconstruí-los via matemática inversa.

## Solução

Três mudanças mínimas e cirúrgicas:

### 1. `src/lib/dashboardUtils.ts` — Adicionar ao `KPIData` e ao `return` de `calculateKPIs`

Adicionar `previousRevenue` e `previousTransactions` à interface `KPIData` e incluí-los no objeto retornado por `calculateKPIs`.

### 2. `src/hooks/useDashboard.ts` — Adicionar ao `DashboardData.kpis`

Adicionar `previousRevenue: number` e `previousTransactions: number` à interface `DashboardData.kpis`. No `return` do `queryFn`, o spread `...kpis` já trará esses valores automaticamente após a mudança acima.

### 3. `src/pages/Index.tsx` — Usar valores diretos do hook

Substituir as duas divisões inversas pelos valores diretos:

```typescript
// ANTES (instável):
const revenueTrend = calculateTrend(
  kpis.totalRevenue,
  kpis.totalRevenue / (1 + kpis.revenueChange / 100),
  dateRange.from, dateRange.to
);

// DEPOIS (estável):
const revenueTrend = calculateTrend(
  kpis.totalRevenue,
  kpis.previousRevenue,
  dateRange.from, dateRange.to
);
```

```typescript
// ANTES (instável):
const transactionsTrend = calculateTrend(
  kpis.transactions,
  kpis.transactions / (1 + kpis.transactionsChange / 100),
  dateRange.from, dateRange.to
);

// DEPOIS (estável):
const transactionsTrend = calculateTrend(
  kpis.transactions,
  kpis.previousTransactions,
  dateRange.from, dateRange.to
);
```

Também atualizar o fallback `kpis` (linha 166 de `Index.tsx`) para incluir os novos campos com valor `0`.

## Fluxo de Dados após a Mudança

```text
previousSalesQuery (já executada no useDashboard)
    ↓
calculateKPIs(currentSales, previousSales)
    ↓ retorna previousRevenue e previousTransactions (NOVO)
useDashboard → kpis.previousRevenue, kpis.previousTransactions
    ↓
Index.tsx → calculateTrend(currentValue, previousValue, ...)
    ↓
KPICard → trend badge sem risco de NaN
```

## Arquivos a Modificar

| Arquivo | Linha(s) | Mudança |
|---|---|---|
| `src/lib/dashboardUtils.ts` | Interface `KPIData` (l.81-91) + `return` de `calculateKPIs` (l.402-413) | Adicionar `previousRevenue` e `previousTransactions` |
| `src/hooks/useDashboard.ts` | Interface `DashboardData.kpis` (l.25-42) | Adicionar `previousRevenue: number` e `previousTransactions: number` |
| `src/pages/Index.tsx` | Fallback kpis (l.166-182) + trends (l.188-200) | Usar valores diretos do hook |

## O que NÃO muda

- Nenhuma query ao banco é adicionada — `previousSales` já é buscado
- `revenueChange` e `transactionsChange` permanecem no objeto (podem ser úteis em outros contextos)
- Comportamento visual dos KPI cards é idêntico — só a fonte dos dados muda
- Todos os outros KPIs (Reembolsos, Cancelamentos) já estão corrigidos e não são tocados
