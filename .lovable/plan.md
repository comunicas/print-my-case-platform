

## Adicionar tooltips com detalhamento de cálculo na tabela Evolução Mensal

### Alteração

**`src/components/financeiro/MonthlyBreakdownTable.tsx`**

Adicionar um tooltip em cada label da primeira coluna com a fórmula e os valores componentes daquele mês. Como cada célula de valor corresponde a um mês diferente, o tooltip ficará no **label da linha** (coluna fixa), mostrando a fórmula geral. Para os valores numéricos de cada mês, ao passar o mouse na célula mostrará o breakdown com os valores reais daquele mês.

Tooltips por linha:
- **Receita Bruta**: "Total de vendas brutas no período"
- **(-) Custos Totais**: Mostra breakdown: `Impostos + Reembolsos + CMV + Taxas Stone + Desp. Fixas + Implantação` com cada valor formatado
- **Resultado do Mês**: `Receita Bruta − Custos Totais` com valores
- **Margem Operacional**: `Resultado Operacional ÷ Receita Líquida × 100` com valores
- **Transações**: "Quantidade de vendas realizadas"

Implementação:
- Importar `Tooltip, TooltipTrigger, TooltipContent, TooltipProvider` do componente existente
- Adicionar uma função `getTooltip(row, monthData)` que retorna o texto do tooltip com os valores componentes formatados para aquele mês
- Envolver cada célula de valor num `Tooltip` que mostra o breakdown numérico
- Envolver o label da linha num `Tooltip` que mostra a fórmula geral

