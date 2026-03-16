

## Tooltips nos Índices Financeiros

Adicionar tooltips explicativos em cada indicador do `FinancialSummaryCard` usando os componentes `Tooltip` já existentes no projeto.

### Alteração

**`src/components/dashboard/FinancialSummaryCard.tsx`**

- Importar `Tooltip, TooltipTrigger, TooltipContent, TooltipProvider` de `@/components/ui/tooltip`
- Adicionar campo `tooltip` em cada indicador no array `indicators`:
  - **Margem Operacional**: "Resultado Operacional ÷ Receita Líquida × 100. Verde ≥ 20%, Amarelo ≥ 10%, Vermelho < 10%"
  - **Custo por Máquina**: "(CMV + Taxas + Despesas Fixas) ÷ Nº de PDVs ativos"
  - **Taxa de Perda**: "(Cancelamentos + Estornos) ÷ Receita Bruta × 100. Verde ≤ 2%, Amarelo ≤ 5%, Vermelho > 5%"
- Envolver cada indicador com `Tooltip` + `TooltipTrigger` (cursor pointer no label) + `TooltipContent` com a fórmula
- Envolver o grid com `TooltipProvider`

Alteração simples, 1 arquivo.

