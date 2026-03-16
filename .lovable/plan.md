

## Relatório Financeiro com Quebra Mensal e Resumo por PDV

### Problema

A página Financeiro mostra apenas 1 mês por vez. O usuário precisa ver um panorama de vários meses, sincronizado com o mês atual, e comparar performance entre PDVs.

### Proposta

Adicionar uma aba **"Resumo"** acima do DRE existente com:

1. **Tabela resumo mensal** — últimos 6 meses lado a lado, com linhas para Receita, Custos, Resultado e Margem Operacional
2. **Quebra por PDV** — quando "Todos PDVs" selecionado, mostra cards comparando cada PDV no mês atual
3. **Mês atual sincronizado** — o resumo sempre inicia no mês corrente e permite scroll para meses anteriores

### Layout

```text
┌─────────────────────────────────────────────┐
│ Financeiro              [PDV ▾] [+ Despesa] │
├─────────────────────────────────────────────┤
│  [Resumo]  [DRE]  [Despesas]                │
├─────────────────────────────────────────────┤
│ Aba Resumo:                                 │
│ ┌─ Tabela 6 meses ────────────────────────┐ │
│ │        Mar/26  Fev/26  Jan/26  Dez/25   │ │
│ │ Receita  R$X    R$X     R$X     R$X     │ │
│ │ Custos   R$X    R$X     R$X     R$X     │ │
│ │ Result.  R$X    R$X     R$X     R$X     │ │
│ │ Margem   XX%    XX%     XX%     XX%     │ │
│ └─────────────────────────────────────────┘ │
│ ┌─ Comparativo PDVs (mês atual) ─────────┐ │
│ │ PDV Tietê     │ PDV Tatuapé            │ │
│ │ Receita R$X   │ Receita R$X            │ │
│ │ Margem  XX%   │ Margem  XX%            │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ Aba DRE: (existente, sem alteração)         │
│ Aba Despesas: (existente, sem alteração)    │
└─────────────────────────────────────────────┘
```

### Alterações por arquivo

1. **`src/hooks/useMonthlyDRESummary.ts`** (novo) — Hook que chama a RPC `get_annual_dre_summary` para o ano corrente + busca `financial_entries` agrupadas por mês, calcula Receita, Custos Totais, Resultado e Margem para os últimos 6 meses
2. **`src/hooks/usePDVComparison.ts`** (novo) — Hook que itera os PDVs do usuário e chama `useDRE` para cada um no mês atual, retornando array comparativo
3. **`src/components/financeiro/MonthlyBreakdownTable.tsx`** (novo) — Tabela horizontal com últimos 6 meses, scroll horizontal no mobile
4. **`src/components/financeiro/PDVComparisonCards.tsx`** (novo) — Grid de cards com métricas por PDV no mês selecionado
5. **`src/pages/Financeiro.tsx`** — Reestruturar com Tabs (Resumo / DRE / Despesas), mover conteúdo existente para aba DRE e Despesas
6. **`src/components/financeiro/index.ts`** — Exportar novos componentes

### Dados

- **Tabela mensal**: Usa RPC `get_annual_dre_summary` (já existe) + `financial_entries` agrupadas por `reference_month`
- **Comparativo PDV**: Usa `get_dre_sales_summary` por PDV individual para o mês corrente
- **Sincronização**: Mês atual é `startOfMonth(new Date())`, tabela mostra 6 meses retroativos

### Considerações

- No mobile, a tabela de meses terá scroll horizontal
- O comparativo PDV só aparece quando "Todos" está selecionado no filtro
- Nenhuma alteração de banco necessária — as RPCs existentes cobrem tudo

