

## Indicador "X de Y total" nos KPIs do Estoque

### Alterações

**1. `src/hooks/useProductStock.ts`**
- Calcular `globalKpis` com `allProducts` (antes dos filtros) além do `kpis` filtrado já existente
- Expor `globalKpis` e `hasActiveFilters` no retorno do hook

**2. `src/components/stock/StockKPICards.tsx`**
- Receber props opcionais `globalKpis` e `isFiltered`
- Quando `isFiltered === true`, exibir o valor como `"11 de 72"` (filtrado de global) nos cards de Total Produtos e Total Unidades
- Nos cards Críticos e Redistribuir, mostrar apenas o valor filtrado (já faz sentido isolado)
- Adicionar um badge/texto sutil "Filtrado" ou ajustar a descrição para indicar contexto

### Comportamento

| Estado | Exibição |
|--------|----------|
| Sem filtros | `72` (normal, como hoje) |
| Com filtros | `11 de 72` nos cards de produtos/unidades |

### Impacto
- 2 arquivos, ~15 linhas alteradas
- Sem migrations

