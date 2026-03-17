

## Corrigir aba Resumo — manter apenas resumo, detalhamento no DRE

### Problema
A `MonthlyBreakdownTable` na aba Resumo foi expandida com todas as linhas detalhadas do DRE (Impostos, CMV, Taxas Stone, Implantação, etc.), duplicando o conteúdo da aba DRE. A aba Resumo deve mostrar apenas uma visão consolidada.

### Alteração

**`src/components/financeiro/MonthlyBreakdownTable.tsx`** — Simplificar linhas para visão resumida

Reduzir o array `rows` para apenas 5 linhas resumidas:
- **Receita Bruta** (bold)
- **Custos Totais** (usa campo `custos` — soma de impostos+reembolsos+cmv+taxas+fixas+implantação)
- **Resultado do Mês** (bold, cor condicional)
- **Margem Operacional** (bold, cor condicional)
- **Transações**

Isso mantém a tabela de evolução mensal como um resumo rápido, enquanto todo o detalhamento linha-a-linha permanece exclusivamente na aba DRE.

Os cálculos no hook `useMonthlyDRESummary` permanecem intactos (os campos detalhados continuam disponíveis para outros consumidores), apenas a tabela de apresentação é simplificada.

