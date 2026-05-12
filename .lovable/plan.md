## Remover todos os botões "Excel" do dashboard (home) + corrigir header quebrado no mobile

### Mudanças

**1. Remover `onExport` / `exportTestId` em todos os gráficos do dashboard:**
- `src/components/dashboard/StockHistoryChart.tsx`
- `src/components/dashboard/SalesByDayChart.tsx`
- `src/components/dashboard/SalesHeatmapChart.tsx`
- `src/components/dashboard/TopProductsChart.tsx`
- `src/components/dashboard/StockByBrandChart.tsx`
- `src/components/dashboard/LossesByDayChart.tsx`

Em cada arquivo:
- Remover as props `onExport={...}` e `exportTestId="..."` passadas ao `<ChartCard>`.
- Remover a função `handleExport` local.
- Remover o import de `exportToExcel` se não for mais usado.

**2. `src/components/dashboard/ChartCard.tsx` — limpar suporte ao export e ajustar header**
- Remover as props `onExport` e `exportTestId` do tipo e do JSX (botão "Excel" + import de `Download`).
- Empilhar header no mobile para o título não competir com o badge de período (caso de "Evolução do Estoque", "Vendas por Dia"): `flex flex-col gap-2 md:flex-row md:items-center md:justify-between`. Em `md+` mantém a linha única atual.
- Adicionar `min-w-0` no wrapper do título para evitar overflow.

**3. `src/lib/dashboardUtils.ts`**
- Manter a função `exportToExcel` (pode ser usada em outras telas como Estoque). Apenas não é mais chamada pelos cards do dashboard.

### Não escopo
- Sem mudanças em outras páginas (Estoque, Financeiro, Uploads). Botões Excel fora da home permanecem.
- Sem alterações em hooks, dados ou lógica de negócio.

### Verificação
1. Mobile 390px (`/`): nenhum card do dashboard exibe botão "Excel"; títulos não quebram em 3 linhas; seletor de período (7d/15d/30d/90d) aparece abaixo do título.
2. Desktop ≥ 768px (`/`): mesmos cards sem botão "Excel", header em uma única linha.
3. Páginas fora da home (ex.: Estoque) continuam com seus exports intactos.
