
# Plano de Refatoração — PrintMyCase

## ✅ Fase 8: Refatoração do OrgDetailDialog (Concluída)
Hook `useOrgDetailActions` extraído com 5 mutations, queries e 15+ estados. OrgDetailDialog reduzido ~55%.

## ✅ Fase 2: Limpeza e Refatoração do Dashboard (Concluída)
- Constante `DEFAULT_KPIS` extraída para fora do componente
- `effectivePdvId` consolidado em variável única (eliminadas 4 repetições)
- Hook genérico `useLocalStorageState` criado e usado para `dateRange` e `consolidatedOpen`
- Trends memoizados com `useMemo` em bloco único
- Early return de loading mantido (hooks computam antes dele)
