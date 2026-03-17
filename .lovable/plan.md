

## Inconsistências Encontradas entre Resumo e DRE

### Problemas

**1. "Despesas Fixas" tem significados diferentes nas duas abas**
- DRE: `despesasFixas = totalFixas` (apenas fixas, implantação é separada)
- Resumo: `despesasFixas = totalFixas + totalImplantacao` (bundled)
- Se existem custos de implantação, a linha "Despesas Fixas" no Resumo mostra valor maior que no DRE

**2. Falta linha de Reembolsos/Deduções na tabela Resumo**
- A tabela mostra Receita Bruta → Impostos → Receita Líquida, mas omite Reembolsos/Deduções
- A Receita Líquida já desconta reembolsos, mas o usuário não vê de onde vem a diferença

**3. Margem calculada sobre bases diferentes**
- DRE: Margem Operacional = `resultadoOperacional / receitaLiquida` (antes da implantação)
- Resumo: Margem = `resultado / receitaLiquida` (depois da implantação)
- Com implantação > 0, as margens divergem

**4. Falta separação de Implantação no Resumo**
- DRE mostra implantação como linha separada (condicional)
- Resumo esconde dentro de "Despesas Fixas"

### Alterações

**1. `src/hooks/useMonthlyDRESummary.ts`** — Separar campos e alinhar com DRE
- Adicionar `reembolsos` (sales.deducoes + totalDeducoes) ao `MonthSummary`
- Adicionar `implantacao` separado
- Mudar `despesasFixas` para conter apenas `totalFixas` (igual ao DRE)
- Adicionar `resultadoOperacional` = lucroBruto - despesasFixas
- Manter `resultado` = resultadoOperacional - implantacao (= resultadoMes do DRE)
- Recalcular `margem` usando `resultadoOperacional` (consistente com DRE)

**2. `src/components/financeiro/MonthlyBreakdownTable.tsx`** — Espelhar estrutura do DRE
- Adicionar linha `(-) Reembolsos / Deduções` entre Impostos e Receita Líquida
- Separar `(-) Despesas Fixas` e `(-) Implantação` em linhas distintas
- Adicionar linha `Resultado Operacional` entre Despesas Fixas e Resultado do Mês
- Renomear "Resultado" → "Resultado do Mês"
- Margem usar resultadoOperacional como numerador

**3. `src/components/financeiro/ResumoKPICards.tsx`** — Usar margem operacional correta
- Trocar `current.margem` por cálculo baseado em `resultadoOperacional / receitaLiquida`

Resultado: as duas abas passarão a exibir exatamente os mesmos valores para cada linha equivalente.

