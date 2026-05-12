## Objetivo

Documentar no `/ds` os 100% dos componentes de gráficos/dashboard usados na plataforma, mantendo o estilo mobile-first e o padrão das demais seções.

## Inventário (`src/components/dashboard/`)

Componentes que recebem dados via props (renderizáveis direto com mocks):
- `KPICard`, `QuickStats`, `FinancialSummaryCard`, `LossAnalysisCard`
- `SalesByDayChart`, `LossesByDayChart`, `TopProductsChart`, `SalesHeatmapChart`, `StockHistoryChart`
- `StockAlertsTable`, `DateRangeFilter`
- Wrappers: `ChartCard`, `ChartEmptyState`, `ChartSkeleton`

Componentes que usam hooks/contextos com fetch real (Supabase):
- `StockByBrandChart` (usa `useSlotsData`) → preview alternativo
- `TopProductsChart` usa `useProductModal` (já existe no provider global → renderiza ok)

Charts de produto em `src/components/stock/`:
- `ProductSalesByDayChart`, `ProductSalesHistoryChart`, `ProductSalesByHourChart`

## Abordagem recomendada

**Renderizar os componentes reais com dados mockados tipados** sempre que possível (zero divergência visual com a plataforma). Para os 1–2 que dependem de hooks com fetch, criar preview equivalente reutilizando `ChartCard` + primitives de `recharts` com a mesma config — assim o /ds continua sendo "espelho vivo" sem precisar de backend.

Vantagens vs. alternativas:
- vs. screenshots: interativo, reflete tokens/tema em tempo real.
- vs. mocks 100% recharts: evita drift quando o componente real evoluir.

## Plano de execução

1. **Nova seção "Charts (dashboard)"** em `src/pages/DesignSystem.tsx`
   - Adicionar grupo `Data viz` no `NAV_SECTIONS` com itens: `kpi-cards`, `chart-wrappers`, `sales-charts`, `stock-charts`, `loss-charts`, `product-charts`, `tables-filters`.

2. **Mocks centralizados** em `src/pages/ds/chartMocks.ts` (novo)
   - `salesByDay`, `lossesByDay`, `topProducts`, `salesHeatmap`, `stockHistory`, `stockByBrand`, `stockAlerts`, `financialSummary`, `lossAnalysis`, `quickStats`, `productSales*`.
   - Tipos importados dos próprios componentes / `lib/dashboardUtils`.

3. **Subseções e exemplos** (`DSExample`):
   - **KPI / Summary**: `KPICard` (variantes positiva/negativa/neutra), `QuickStats`, `FinancialSummaryCard`, `LossAnalysisCard`.
   - **Chart wrappers**: `ChartCard` (com children placeholder), `ChartSkeleton`, `ChartEmptyState`.
   - **Sales**: `SalesByDayChart`, `SalesHeatmapChart`, `TopProductsChart`.
   - **Stock**: `StockHistoryChart`, `StockByBrandChart` (preview standalone, ver passo 4).
   - **Losses**: `LossesByDayChart`.
   - **Product (stock/)**: `ProductSalesByDayChart`, `ProductSalesHistoryChart`, `ProductSalesByHourChart`.
   - **Tabelas/Filtros**: `StockAlertsTable`, `DateRangeFilter`.

4. **Preview standalone para `StockByBrandChart`**
   - Renderizar dentro de `<DSExample>` um `ChartCard` + `PieChart` recharts com os mesmos tokens (`getStockByBrand` aplicado a um array fixo). Comentário no código apontando que o componente real busca via `useSlotsData`.

5. **Cuidados mobile-first**
   - Cada chart dentro de wrapper com `min-w-0` + altura fixa (`h-[260px]` em mobile, `md:h-[320px]`).
   - `DSExample` já tem `overflow-x-auto`; manter.
   - Gráficos com legenda longa: forçar `flex-wrap` no legend container quando aplicável.

6. **Rodapé**: atualizar contagem (ex.: "61 UI + 18 dashboard componentes documentados").

## Detalhes técnicos

- Não tocar nos componentes de `dashboard/` (apenas consumir).
- Mocks usam tipos exportados (`SalesByDayData`, `TopProductData`, etc.) para que mudanças de schema quebrem o build do /ds — sinal saudável.
- `ProductModalContext` já está no `App.tsx`, então `TopProductsChart` funciona dentro do `/ds` sem alteração.
- Não adicionar dependências.

## Critérios de verificação

- `/ds` renderiza todos os 15 componentes de `dashboard/` + 3 de `stock/` charts sem erros.
- Sem scroll horizontal em 360×800.
- Tema claro/escuro: cores dos charts respondem aos tokens `--chart-*`.
- Build TypeScript sem erros.

## Fora de escopo

- Refatorar `StockByBrandChart` para aceitar dados via props (pode entrar em PR futuro).
- Restilizar charts para tokens M3 puros.
