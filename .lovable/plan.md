

# Filtro de meses e alternancia de tipo de grafico no Resumo

## Resumo

Adicionar dois controles na aba Resumo do Financeiro:
1. **Toggle "Ano completo"** ao lado do seletor de ano -- permite ver todos os 12 meses (incluindo futuros zerados) ou apenas ate o mes atual
2. **Seletor de tipo de grafico** em cada ChartCard -- permite alternar entre diferentes visualizacoes (Area, Barras, Linha) para a mesma informacao

---

## Alteracoes

### 1. `src/components/financeiro/AnnualSummary.tsx`
- Adicionar estado `showFullYear` (boolean, default `false`)
- Renderizar um toggle/switch "Ano completo" ao lado do seletor de ano
- Quando ativo, passar `monthlyData` completo (12 meses) em vez do filtrado
- Quando desativado, manter o comportamento atual (filtra meses futuros)

### 2. `src/components/dashboard/ChartCard.tsx`
- Adicionar prop opcional `chartTypeOptions` (array de tipos disponiveis, ex: `["area", "bar", "line"]`)
- Adicionar prop opcional `activeChartType` e `onChartTypeChange`
- Renderizar botoes pequenos (icones) no header do card quando `chartTypeOptions` esta presente
- Usar icones do lucide: `AreaChart`, `BarChart3`, `LineChart`

### 3. `src/components/financeiro/RevenueEvolutionChart.tsx`
- Adicionar estado local `chartType` com opcoes: `area` (default), `bar`, `line`
- Renderizar o grafico correspondente ao tipo selecionado
- Passar `chartTypeOptions` ao `ChartCard`

### 4. `src/components/financeiro/MarginsChart.tsx`
- Adicionar estado local `chartType` com opcoes: `line` (default), `area`, `bar`
- Renderizar o grafico correspondente ao tipo selecionado

### 5. `src/components/financeiro/CostCompositionChart.tsx`
- Adicionar estado local `chartType` com opcoes: `bar` (default), `area`, `line`
- Renderizar o grafico correspondente ao tipo selecionado

---

## Detalhes tecnicos

### Toggle "Ano completo" no AnnualSummary

```typescript
const [showFullYear, setShowFullYear] = useState(false);

const displayData = useMemo(() => {
  if (showFullYear || year < currentYear) return monthlyData;
  if (year === currentYear) return monthlyData.filter((m) => m.monthIndex <= currentMonth);
  return [];
}, [monthlyData, year, currentYear, currentMonth, showFullYear]);
```

UI: Switch compacto com label "Ano completo" posicionado ao lado do seletor de ano.

### ChartCard com seletor de tipo

Adicionar ao header do ChartCard um grupo de botoes pequenos (toggle group) com icones representando cada tipo de grafico:

```text
+-------------------------------------------+
| [icon] Titulo          [Area] [Bar] [Line] |
| Descricao                                  |
+-------------------------------------------+
```

Usar `ToggleGroup` do Radix/Shadcn para manter consistencia visual.

### Graficos multi-tipo

Cada componente de grafico tera um switch interno:

```typescript
const [chartType, setChartType] = useState<"area" | "bar" | "line">("area");

// No render, trocar entre AreaChart, BarChart e LineChart do Recharts
// mantendo os mesmos dataKeys, config, tooltips e legends
```

---

## Arquivos modificados

| Arquivo | Alteracao |
|---------|-----------|
| `AnnualSummary.tsx` | Adicionar toggle "Ano completo" com estado local |
| `ChartCard.tsx` | Adicionar props para seletor de tipo de grafico no header |
| `RevenueEvolutionChart.tsx` | Suportar 3 tipos de grafico (area/bar/line) |
| `MarginsChart.tsx` | Suportar 3 tipos de grafico (line/area/bar) |
| `CostCompositionChart.tsx` | Suportar 3 tipos de grafico (bar/area/line) |

