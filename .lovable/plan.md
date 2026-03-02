
# Refinamento dos Graficos e Indices do Financeiro

## Problemas Identificados

### 1. Tooltip do Grafico de Margens quebrado
O `MarginsChart` usa um `formatter` que retorna `[valor, ""]` -- o segundo elemento vazio faz o tooltip nao exibir o nome da serie. No replay da sessao, o tooltip mostra apenas "-7251.1%" e "73.7%" sem identificar qual e Margem Bruta e qual e Margem Operacional.

### 2. Calculo de margem inconsistente entre Resumo e DRE
- `MarginsChart` calcula margem como `lucroBruto / receitaBruta` (sobre receita bruta)
- `DRETable` calcula margem como `lucroBruto / receitaLiquida` (sobre receita liquida)
- Corrigir para usar `receitaLiquida` como denominador em ambos, que e o padrao contabil correto

### 3. Falta de legendas nos 3 graficos
Nenhum dos graficos tem `<Legend>` do Recharts, tornando dificil identificar as series visuais. O padrao do projeto (ex: `SalesByDayChart`) usa `<Legend>`.

### 4. Tooltips dos graficos de Evolucao e Custos com formatacao duplicada
Os formatters de `RevenueEvolutionChart` e `CostCompositionChart` tentam retornar `[valor_formatado, label]`, mas o `ChartTooltipContent` do Shadcn ja renderiza o label da config automaticamente via `nameKey`. Isso pode causar labels duplicados ou ausentes. Precisa alinhar com o padrao Shadcn.

### 5. Meses sem dados mostram valores zero nos tooltips
Quando um mes nao tem vendas, os graficos mostram R$ 0,00 nos tooltips. Melhor ocultar meses futuros (apos o mes atual) para evitar confusao.

---

## Alteracoes Propostas

### `src/components/financeiro/MarginsChart.tsx`
- Corrigir calculo de margem: usar `receitaLiquida` como denominador em vez de `receitaBruta`
- Corrigir tooltip: incluir label da serie (Margem Bruta / Margem Operacional) junto ao valor percentual
- Adicionar `<Legend>` com labels claros
- Limitar dados ate o mes atual (nao mostrar meses futuros com valor null)
- Adicionar label na `ReferenceLine` y=0 ("Breakeven")

### `src/components/financeiro/RevenueEvolutionChart.tsx`
- Adicionar `<Legend>` com labels das 4 series
- Ajustar tooltip formatter para usar o padrao correto do ChartTooltipContent (sem duplicar label)
- Limitar dados ate o mes atual

### `src/components/financeiro/CostCompositionChart.tsx`
- Adicionar `<Legend>` com labels das 5 categorias de custo
- Ajustar tooltip formatter para o padrao correto
- Limitar dados ate o mes atual

### `src/components/financeiro/AnnualKPICards.tsx`
- Exibir "--" quando nao ha dados (em vez de R$ 0,00 e 0.0%)
- Adicionar indicacao sutil do numero de meses com dados (ex: "8 meses com dados")

### `src/components/financeiro/AnnualSummary.tsx`
- Filtrar monthlyData para passar apenas meses ate o mes atual (no ano corrente) ou todos os 12 (anos passados), evitando barras/linhas zeradas para meses futuros

### `src/hooks/useAnnualDRE.ts`
- Nenhuma alteracao necessaria nos calculos

---

## Detalhes Tecnicos

### Correcao do MarginsChart (principal)

```typescript
// ANTES (errado - usa receitaBruta):
margemBruta: d.receitaBruta > 0 ? (d.lucroBruto / d.receitaBruta) * 100 : null,
margemOperacional: d.receitaBruta > 0 ? (d.resultadoOperacional / d.receitaBruta) * 100 : null,

// DEPOIS (correto - usa receitaLiquida, alinhado com DRETable):
margemBruta: d.receitaLiquida > 0 ? (d.lucroBruto / d.receitaLiquida) * 100 : null,
margemOperacional: d.receitaLiquida > 0 ? (d.resultadoOperacional / d.receitaLiquida) * 100 : null,
```

### Padrao de Legend (seguindo SalesByDayChart)

```typescript
<Legend 
  verticalAlign="top" 
  height={36}
  formatter={(value) => chartConfig[value]?.label ?? value}
/>
```

### Filtragem de meses futuros no AnnualSummary

```typescript
const currentMonth = new Date().getMonth(); // 0-11
const displayData = year < currentYear
  ? monthlyData
  : monthlyData.filter((m) => m.monthIndex <= currentMonth);
```

Isso remove barras/linhas zeradas para Mar-Dez quando visualizando 2026 (estamos em Marco).

---

## Arquivos modificados

| Arquivo | Alteracao |
|---------|-----------|
| `MarginsChart.tsx` | Corrigir denominador da margem, tooltip com labels, adicionar Legend e label no breakeven |
| `RevenueEvolutionChart.tsx` | Adicionar Legend, ajustar tooltip |
| `CostCompositionChart.tsx` | Adicionar Legend, ajustar tooltip |
| `AnnualKPICards.tsx` | Exibir "--" quando sem dados, mostrar qtd de meses |
| `AnnualSummary.tsx` | Filtrar meses futuros antes de passar aos graficos |
