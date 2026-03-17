

## Revisão de Cálculos e Detalhamento da Aba Resumo

### Problemas Identificados

**1. Bug de duplicação no Comparativo PDV**
Em `usePDVComparison.ts`, a query de entries usa `pdv_id.eq.${pdv.id},pdv_id.is.null` para cada PDV. Despesas com `pdv_id=null` (despesas gerais da org) são contadas **integralmente para cada PDV**, inflando os custos. Se há 3 PDVs e R$3.000 em despesas fixas gerais, cada PDV mostra R$3.000 ao invés de R$1.000.

**Correção**: Dividir despesas com `pdv_id=null` pelo número de PDVs ativos.

**2. Tabela Resumo muito simplificada**
Hoje a `MonthlyBreakdownTable` mostra apenas 4 linhas (Receita, Custos, Resultado, Margem). Faltam linhas intermediárias do DRE para dar visibilidade sobre onde os custos estão concentrados.

**3. Falta de KPIs resumidos no topo**
A aba Resumo não tem cards de destaque com os números do mês atual.

### Validação das Fórmulas (3 abas)

As fórmulas são consistentes entre `useDRE`, `useMonthlyDRESummary` e `usePDVComparison`:
- Receita Líquida = Receita Bruta − Impostos − Reembolsos ✓
- Lucro Bruto = Receita Líquida − CMV − Taxas Stone ✓
- EBITDA = Lucro Bruto − Despesas Fixas ✓
- Resultado = EBITDA − Implantação ✓
- Margem = Resultado ÷ Receita Líquida × 100 ✓

Único problema real é o item 1 (double-counting no comparativo).

### Alterações

**1. `src/hooks/usePDVComparison.ts`** — Corrigir double-counting
- Separar query de entries com `pdv_id=null` da query com `pdv_id.eq.${pdv.id}`
- Dividir total das entries gerais (`pdv_id=null`) pelo número de PDVs ativos antes de somar aos custos individuais

**2. `src/hooks/useMonthlyDRESummary.ts`** — Expandir interface `MonthSummary`
- Adicionar campos: `receitaLiquida`, `lucroBruto`, `despesasFixas`, `cmv`, `impostos`, `transacoes`
- Manter cálculos existentes, apenas expor os valores intermediários já calculados

**3. `src/components/financeiro/MonthlyBreakdownTable.tsx`** — Enriquecer tabela
- Adicionar linhas: Receita Líquida, CMV, Lucro Bruto, Despesas Fixas, EBITDA
- Agrupar visualmente com separadores entre seções (Receita / Custos / Resultado)
- Adicionar linha de Transações no final
- Aplicar cores condicionais nos valores negativos

**4. `src/components/financeiro/ResumoKPICards.tsx`** (novo) — Cards de destaque do mês atual
- 4 mini-cards no topo da aba Resumo: Receita do Mês, Resultado, Margem Operacional, Total Transações
- Dados extraídos do primeiro item do array `monthlyData` (mês corrente)
- Cores condicionais (verde/amarelo/vermelho) para margem e resultado

**5. `src/pages/Financeiro.tsx`** — Integrar novo componente
- Adicionar `ResumoKPICards` acima da `MonthlyBreakdownTable` na aba Resumo

**6. `src/components/financeiro/index.ts`** — Exportar `ResumoKPICards`

