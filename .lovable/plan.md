

# Analise de Performance: Queries, Re-renders e Bundle Size

## Status: ✅ Implementado (Fases 1-3)

### Fase 1 — Quick Wins ✅
- **useMemo nos context values**: AuthContext e ActiveOrgContext agora usam `useMemo` + `useCallback` para evitar cascata de re-renders
- **refetchIntervalInBackground: false**: Notifications não fazem polling quando a aba está em background
- **Lazy import do xlsx**: Já estava implementado via `import('xlsx')` em `dashboardUtils.ts`

### Fase 2 — Correção de bugs de cache ✅
- **Prefetch removido**: `prefetchDashboard` e `prefetchStock` foram removidos de `usePrefetchRoutes` porque suas query keys e data shapes não batiam com os hooks reais, causando fetches duplicados ao invés de cache hits
- Mantidos apenas `prefetchOrganizations` e `prefetchMarketing` que estão alinhados

### Fase 3 — Otimização de queries ✅
- **Lazy-load stock no dashboard**: `StockByBrandChart` e `StockHistoryChart` agora buscam seus próprios dados internamente via `useSlotsData` e `useStockHistory`, removendo 2 queries da carga inicial do dashboard
- **ProductAnalytics server-side filtering**: Adicionado `ilike` pre-filter no banco antes do `filterSalesByProduct` client-side, reduzindo transferência de dados ~90%. Limite reduzido de 10.000 para 5.000
- **Limites de query reduzidos**: `DASHBOARD_SALES_LIMIT` 10.000→5.000, `PRODUCT_STOCK_SALES_LIMIT` 5.000→3.000

### Itens pendentes (baixa prioridade)
- 2.1: ProfileContext dedicado (reduziria re-renders em 20+ componentes)
- 1.5: RPC para data range min/max (2 queries → 1)
- 2.4: React.memo nos SlotStack (re-renders no grid de estoque)
