
# Adicionar Ticket Médio Global na Visão Consolidada do super_admin

## Diagnóstico

A Visão Consolidada em `Index.tsx` (linhas 251-269) renderiza um `grid-cols-2 md:grid-cols-4` com 4 métricas fixas. O `globalMetrics` em `useDashboard.ts` tem `totalRevenueGlobal` e `totalTransactionsGlobal` mas **não calcula** `avgTicketGlobal`.

### Estado atual do grid:
```
[ Organizações ] [ PDVs Total ] [ Receita Global ] [ Transações Global ]
      4 colunas — grid-cols-2 md:grid-cols-4
```

### Estado desejado:
```
[ Organizações ] [ PDVs Total ] [ Receita Global ] [ Transações Global ] [ Ticket Médio Global ]
      5 colunas — grid-cols-2 sm:grid-cols-3 md:grid-cols-5
```

## Mudanças Necessárias

### 1. `src/hooks/useDashboard.ts` — Adicionar `avgTicketGlobal` ao `globalMetrics`

**Interface `DashboardData`** (linha 45-50): adicionar campo na definição de tipo:
```typescript
globalMetrics?: {
  totalOrganizations: number;
  totalPdvsGlobal: number;
  totalRevenueGlobal: number;
  totalTransactionsGlobal: number;
  totalRefundsGlobal: number;
  avgTicketGlobal: number;   // ← novo campo
};
```

**Cálculo** (dentro do bloco `if (!orgsResult.error && ...)`, logo após o cálculo de `totalRefundsGlobal`):
```typescript
const avgTicketGlobal = globalSalesData.length > 0
  ? totalRevenueGlobal / globalSalesData.length
  : 0;

globalMetrics = {
  totalOrganizations: orgsResult.count || 0,
  totalPdvsGlobal: globalPdvsResult.count || 0,
  totalRevenueGlobal,
  totalTransactionsGlobal: globalSalesData.length,
  totalRefundsGlobal,
  avgTicketGlobal,   // ← novo campo
};
```

Nota: o cálculo usa `globalSalesData.length` (transações totais) como denominador, alinhado com como `avgTicket` é calculado nos KPIs normais via `calculateKPIs`.

### 2. `src/pages/Index.tsx` — Adicionar 5º card e ajustar grid

**Grid** (linha 252): de `grid-cols-2 md:grid-cols-4` para `grid-cols-2 sm:grid-cols-3 md:grid-cols-5` — compatível com mobile (2 colunas → 3 no tablet → 5 no desktop).

**Novo card** adicionado após "Transações Global":
```tsx
<div className="text-center md:text-left">
  <p className="text-xl md:text-2xl font-bold text-foreground">
    {formatCurrency(globalMetrics.avgTicketGlobal)}
  </p>
  <p className="text-xs md:text-sm text-muted-foreground">Ticket Médio Global</p>
</div>
```

Já existe o import de `formatCurrency` em `Index.tsx` (linha 29), sem necessidade de novos imports.

## Resultado Visual

```
MOBILE (2 colunas):
[ Organizações ] [ PDVs Total ]
[ Receita Global ] [ Transações Global ]
[ Ticket Médio Global ]

TABLET sm (3 colunas):
[ Organizações ] [ PDVs Total ] [ Receita Global ]
[ Transações Global ] [ Ticket Médio Global ]

DESKTOP md+ (5 colunas):
[ Organizações ] [ PDVs Total ] [ Receita Global ] [ Transações Global ] [ Ticket Médio Global ]
```

## O Que NÃO muda

- Lógica de queries do `useDashboard` — sem novas queries ao banco
- KPI Cards do dashboard principal — zero impacto
- RLS/banco — sem migrações, dado calculado client-side a partir de dados já buscados
- Outros hooks (`useDashboardDataRange`, `useUploads`) — sem toque
- Layout de usuários não super_admin — bloco condicional `isSuperAdmin && globalMetrics`

## Arquivos a Modificar

| Arquivo | Mudança |
|---|---|
| `src/hooks/useDashboard.ts` | Adicionar `avgTicketGlobal` na interface e no objeto de retorno |
| `src/pages/Index.tsx` | Ajustar grid para 5 colunas + adicionar card "Ticket Médio Global" |
