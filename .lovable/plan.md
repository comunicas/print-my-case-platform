
# Adicionar Trend ao KPI de Ticket Médio

## Estado Atual

O card "Ticket Médio" em `Index.tsx` (linha 355-360) é o único dos 5 KPIs de vendas **sem** o prop `trend`:

```tsx
<KPICard
  testId="kpi-avg-ticket"
  title="Ticket Médio"
  value={formatCurrency(kpis.avgTicket)}
  icon={TrendingUp}
  // ← sem trend
/>
```

Os outros 4 cards (Receita, Transações, Reembolsos, Cancelamentos) já usam `calculateTrend(currentValue, previousValue, ...)` com valores diretos do hook.

## Causa

`calculateKPIs` em `dashboardUtils.ts` calcula `avgTicket` para o período atual (linha 389), mas nunca calcula `previousAvgTicket`. Consequentemente, `KPIData`, `DashboardData.kpis` e `useDashboard` não expõem esse valor — e `Index.tsx` não tem como calcular o trend de forma segura.

## Como `avgTicket` é calculado

```typescript
// dashboardUtils.ts linha 389
const avgTicket = transactions > 0 ? totalRevenue / transactions : 0;
```

O `previousAvgTicket` segue a mesma lógica, usando os valores já disponíveis `previousRevenue` e `previousTransactions`:

```typescript
const previousAvgTicket = previousTransactions > 0 
  ? previousRevenue / previousTransactions 
  : 0;
```

Não é necessária nenhuma query adicional ao banco — os dados já estão em memória.

## Mudanças — 3 arquivos, cirúrgicas

### 1. `src/lib/dashboardUtils.ts`

**Na interface `KPIData`** (linha 93, após `previousTransactions`):
```typescript
previousAvgTicket: number;
```

**No `return` de `calculateKPIs`** (após linha 415, antes do fechamento):
```typescript
// Calcular previousAvgTicket antes do return
const previousAvgTicket = previousTransactions > 0 
  ? previousRevenue / previousTransactions 
  : 0;

return {
  ...campos existentes...
  previousRevenue,
  previousTransactions,
  previousAvgTicket, // NOVO
};
```

### 2. `src/hooks/useDashboard.ts`

**Na interface `DashboardData.kpis`** (após `previousTransactions: number`):
```typescript
previousAvgTicket: number;
```

O spread `...kpis` no `return` do `queryFn` já trará `previousAvgTicket` automaticamente — sem nenhuma outra mudança no hook.

### 3. `src/pages/Index.tsx`

**No fallback `kpis`** (após `previousTransactions: 0`):
```typescript
previousAvgTicket: 0,
```

**Adicionar o cálculo do trend** (após `cancellationsTrend`, linha ~218):
```typescript
const avgTicketTrend = calculateTrend(
  kpis.avgTicket,
  kpis.previousAvgTicket,
  dateRange.from,
  dateRange.to
);
```

**Passar o trend ao `KPICard` de Ticket Médio**:
```tsx
<KPICard
  testId="kpi-avg-ticket"
  title="Ticket Médio"
  value={formatCurrency(kpis.avgTicket)}
  icon={TrendingUp}
  trend={avgTicketTrend}   // ← NOVO
/>
```

## Fluxo de Dados

```text
previousSales (já buscado no useDashboard)
    ↓
calculateKPIs(currentSales, previousSales)
    ↓ previousRevenue e previousTransactions (já existem)
    ↓ previousAvgTicket = previousRevenue / previousTransactions (NOVO)
DashboardData.kpis.previousAvgTicket (NOVO)
    ↓
Index.tsx → calculateTrend(kpis.avgTicket, kpis.previousAvgTicket, ...)
    ↓
KPICard trend badge: ex. "+12,5%" ou "Sem dados anteriores"
```

## O que NÃO muda

- Nenhuma query ao banco adicionada
- Valor exibido no card ("Ticket Médio") idêntico
- Comportamento dos outros 5 KPI cards não é tocado
- `avgTicket` atual permanece inalterado

## Arquivos a Modificar

| Arquivo | Onde | Mudança |
|---|---|---|
| `src/lib/dashboardUtils.ts` | Interface `KPIData` + `return` de `calculateKPIs` | Adicionar `previousAvgTicket` |
| `src/hooks/useDashboard.ts` | Interface `DashboardData.kpis` | Adicionar `previousAvgTicket: number` |
| `src/pages/Index.tsx` | Fallback kpis + trend calculation + KPICard | Usar `previousAvgTicket` no trend |
