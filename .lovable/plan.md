
# Análise Completa e Plano de Limpeza — Dashboard (Home)

## Diagnóstico: O que foi encontrado

### A — Legados e Campos Mortos

**1. `revenueChange`, `transactionsChange`, `refundsChange`, `cancellationsChange` são legados funcionais**

Esses campos existem em 3 lugares e nunca são **lidos** em `Index.tsx` para nada. Após as refatorações recentes, as trends são calculadas 100% via `calculateTrend(currentValue, previousValue)`. Os campos `*Change` ainda são:
- Calculados em `dashboardUtils.ts` (`calculateKPIs`)
- Transportados em `useDashboard.ts` (`DashboardData.kpis`)
- Inicializados no fallback de `Index.tsx`
- Mas **nunca consumidos em nenhum JSX ou lógica de renderização**

**Impacto:** código morto, sem risco, mas que aumenta superfície de manutenção.

**2. `previousRefunds` duplicado na interface de `useDashboard.ts`**

Em `DashboardData.kpis`, `previousRefunds` está declarado duas vezes — uma vez explicitamente (linha 36) e uma vez via spread de `calculateKPIs` que já o inclui. O campo aparece separado do grupo "previous period raw values" por causa de adições incrementais em sprints diferentes, criando inconsistência de organização.

**3. `calculateTotalRevenue` importado mas não usado em `useDashboard.ts`**

A função `calculateTotalRevenue` é importada do `dashboardUtils` mas seu uso direto foi substituído pela função `calculateKPIs` que já o encapsula internamente. Gera um warning de "unused import" latente.

**4. `dataRange` prop em `DateRangeFilter` nunca passada do `Index.tsx`**

O componente `DateRangeFilter` aceita `dataRange?: { min: Date; max: Date }` e possui lógica para exibir "Dados: dd/MM - dd/MM" e botão "Ver tudo" — mas `Index.tsx` nunca passa essa prop. A feature está implementada e morta.

---

### B — Inconsistências Estruturais

**5. Indentação incorreta na interface `DashboardData` em `useDashboard.ts`**

```typescript
export interface DashboardData {
    kpis: {     // ← 4 espaços (errado, deveria ser 2)
    totalRevenue: ...  // ← 4 espaços (alinhado na posição errada)
```
Toda a propriedade `kpis` tem indentação extra que quebra a uniformidade do arquivo.

**6. `StockHistoryChart` não usa `ChartCard` (inconsistência de padrão)**

Todos os outros gráficos (`SalesByDayChart`, `TopProductsChart`, `StockByBrandChart`, `SalesHeatmapChart`, `LossesByDayChart`) usam o componente `ChartCard` como wrapper padronizado (com título, ícone, descrição, botão de exportar). O `StockHistoryChart` implementa seu próprio `Card + CardHeader + CardTitle` manualmente, com estrutura diferente — sem ícone, sem descrição, com layout próprio.

**7. Ausência de `testId` em `LossesByDayChart`**

O `ChartCard` de `LossesByDayChart` não recebe `testId`, enquanto todos os outros gráficos têm `data-testid` definido para testes E2E.

---

### C — Problemas de Responsividade

**8. KPI grid: `lg:grid-cols-6` causa cards muito estreitos em desktop médio (1024-1280px)**

Com 6 colunas em `lg` (1024px+) e sidebar aberta (~240px), o espaço real por card é ~130px — insuficiente para exibir `formatCurrency(value)` sem truncar. O design note documenta `xl:grid-cols-3` como padrão quando sidebar está aberta.

**Situação atual:**
```
grid grid-cols-2 lg:grid-cols-6 gap-2 md:gap-4
```

**Problema:** entre 1024px e 1280px com sidebar expandida os cards são muito comprimidos. A solução correta é escalar gradualmente: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6`.

**9. Filtros Bar: em mobile com super_admin ativo, a barra de filtros tem 3 elementos sem `flex-wrap`**

Em mobile (`<640px`), `DateRangeFilter` (botões de preset) + Select de organização + `PDVFilter` ficam empilhados em coluna. O Select do `Building2` (organização) não tem `w-full` no mobile — usa `sm:w-[200px]` que em tela pequena precisa de `w-full`.

**10. `LossAnalysisCard`: barra visual usa `bg-warning` sem fallback para dark mode**

A barra de progresso usa `bg-warning` e `bg-destructive` diretamente. As variáveis CSS `--warning` e `--destructive` existem em dark mode, então está correto — mas o card não usa `animate-fade-in-up` nem `style={{ animationDelay }}` como os demais cards, criando inconsistência visual de entrada.

**11. `StockHistoryChart`: altura `h-[220px]` enquanto outros usam `h-[300px]`**

O gráfico de estoque usa `h-[220px]` enquanto `SalesByDayChart` e `LossesByDayChart` usam `h-[300px]`, criando assimetria visual nas linhas de 2 colunas.

**12. Heatmap: células `h-6 md:h-8` funcionam bem, mas a label lateral usa `text-[10px] md:text-xs`**

Em mobile o heatmap é muito comprimido. A célula tem apenas 24px de altura e a label temporal (`08h-10h`) fica ilegível abaixo de `sm`. Não há breakpoint para ocultar o heatmap em mobile ou reduzir a grade — o componente não tem `overflow-x-auto` no container.

---

### D — Código de Qualidade

**13. `today` é constante no módulo em `DateRangeFilter.tsx`**

```typescript
const today = new Date(); // definida fora do componente — congela no momento do import
```
Se o usuário deixar a aba aberta meia-noite, `today` permanece o dia anterior. Deve ser calculado dentro dos callbacks (já é assim nos presets do `handlePresetClick` — mas a `const today` no topo do arquivo é usada nos `PRESETS`).

**14. `pluralize` é importado duas vezes em `SalesHeatmapChart.tsx`**

```typescript
import { cn, pluralize } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils"; // segunda importação do mesmo módulo
```
Devem ser consolidadas em uma linha.

---

## Plano de Implementação

### Arquivo 1: `src/lib/dashboardUtils.ts`
- Remover `revenueChange`, `transactionsChange`, `refundsChange` da interface `KPIData`
- Remover as 3 variáveis e seus cálculos em `calculateKPIs`
- Reorganizar o `return` de `calculateKPIs` agrupando logicamente: valores atuais → valores anteriores

### Arquivo 2: `src/hooks/useDashboard.ts`
- Corrigir indentação da interface `DashboardData` (4 espaços → 2 espaços)
- Remover `revenueChange`, `transactionsChange`, `refundsChange`, `cancellationsChange` de `DashboardData.kpis`
- Remover import de `calculateTotalRevenue` (não usado diretamente)
- Reorganizar campos do `kpis` em grupos comentados: atuais / anteriores / cancelamentos

### Arquivo 3: `src/pages/Index.tsx`
- No fallback `kpis`, remover `revenueChange: 0`, `transactionsChange: 0`, `refundsChange: 0`, `cancellationsChange: 0` (campos removidos do tipo)
- Corrigir grid de KPIs: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6` para escalar melhor
- Adicionar `w-full sm:w-[200px]` no Select de organização para mobile super_admin

### Arquivo 4: `src/components/dashboard/StockHistoryChart.tsx`
- Migrar para usar `ChartCard` como wrapper (como todos os outros gráficos)
- Adicionar ícone (`History`), descrição ("Evolução do estoque por marca no período"), `testId="stock-history-chart"` via ChartCard
- Corrigir altura: `h-[220px]` → `h-[280px]` para paridade visual com outros gráficos
- Manter os botões de período (7d/15d/30d/90d) no `headerBadge` ou como slot extra no ChartCard

### Arquivo 5: `src/components/dashboard/LossesByDayChart.tsx`
- Adicionar `testId="losses-by-day-chart"` ao `ChartCard`

### Arquivo 6: `src/components/dashboard/LossAnalysisCard.tsx`
- Adicionar `animate-fade-in-up` ao `Card`
- Adicionar `animationDelay?: number` prop

### Arquivo 7: `src/components/dashboard/SalesHeatmapChart.tsx`
- Consolidar imports duplicados de `@/lib/utils`
- Adicionar `overflow-x-auto` no container do heatmap para mobile

### Arquivo 8: `src/components/dashboard/DateRangeFilter.tsx`
- Mover `const today = new Date()` para dentro de cada callback `getDates` (evitar data congelada no módulo)
- Atualizar `PRESETS` para calcular `today` dinamicamente em cada chamada

---

## Resumo Visual dos Problemas

| # | Tipo | Arquivo | Descrição |
|---|------|---------|-----------|
| 1 | Legado morto | `dashboardUtils.ts` / `useDashboard.ts` / `Index.tsx` | `*Change` calculados, exportados, nunca lidos |
| 2 | Legado morto | `useDashboard.ts` | Import de `calculateTotalRevenue` sem uso |
| 3 | Feature morta | `DateRangeFilter.tsx` | Prop `dataRange` nunca passada do Index |
| 4 | Indentação | `useDashboard.ts` | Interface `DashboardData.kpis` com 4 espaços |
| 5 | Padrão inconsistente | `StockHistoryChart.tsx` | Único gráfico sem `ChartCard` |
| 6 | testId faltando | `LossesByDayChart.tsx` | Sem `testId` para E2E |
| 7 | Responsividade | `Index.tsx` | KPI grid sem breakpoint `sm:grid-cols-3` |
| 8 | Responsividade | `Index.tsx` | Select org sem `w-full` mobile |
| 9 | Animação | `LossAnalysisCard.tsx` | Sem `animate-fade-in-up` |
| 10 | Altura | `StockHistoryChart.tsx` | `h-[220px]` vs `h-[300px]` nos pares |
| 11 | Overflow | `SalesHeatmapChart.tsx` | Heatmap sem `overflow-x-auto` |
| 12 | Import duplo | `SalesHeatmapChart.tsx` | Dois imports do mesmo módulo `@/lib/utils` |
| 13 | Data congelada | `DateRangeFilter.tsx` | `today` estática no módulo |

## O que NÃO será tocado

- Lógica de queries (nenhuma mudança no banco)
- Cálculo de trends (já correto e estável)
- Lógica de presets e calendário (recém refatorada)
- Componentes de chart internos (Recharts, dados)
- KPICard, QuickStats, StockAlertsTable (sem problemas encontrados)
- Testes existentes (nenhuma quebra de interface pública)
