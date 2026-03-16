

## Refinamento da Home: KPIs Condensados + Índices Financeiros

### Resumo

Simplificar os 6 KPIs atuais para 4, unificando perdas e adicionando dois novos índices financeiros: **Margem Operacional** e **Custo por Máquina (CPM)**.

### Layout dos 4 KPIs (grid 2x2 mobile, 4 cols desktop)

| KPI | Fórmula | Fonte |
|-----|---------|-------|
| **Receita** | Receita líquida (mantém) | `kpis.totalRevenue` |
| **Transações** | Total transações (mantém) | `kpis.transactions` |
| **Ticket Médio** | Receita / Transações (mantém) | `kpis.avgTicket` |
| **Perdas** | Cancelamentos + Reembolsos (unifica 2 KPIs) | `kpis.totalCancellations + kpis.totalRefunds` |

### Novos Índices Financeiros (card resumo abaixo dos KPIs)

Card compacto com 3 indicadores inline:

1. **Margem Operacional %** — `(Resultado Operacional / Receita Líquida) × 100`
   - Fonte: hook `useDRE` com mês corrente
   - Verde se > 20%, amarelo 10-20%, vermelho < 10%

2. **CPM (Custo por Máquina)** — `(CMV + Taxas Stone + Despesas Fixas) / PDVs ativos`
   - Fonte: DRE + `kpis.activePdvs`

3. **Taxa de Perda %** — `(Cancelamentos + Reembolsos) / Receita Bruta × 100`
   - Fonte: dados já disponíveis nos KPIs do dashboard

### O que muda

- **Remover** KPIs separados de "Reembolsos" e "Cancelamentos" → unificar em "Perdas"
- **Remover** KPI "Estoque Crítico" dos KPIs principais (a tabela de alertas já cobre isso)
- **Grid KPIs**: `xl:grid-cols-6` → `xl:grid-cols-4`
- **Novo componente**: `FinancialSummaryCard` — card com os 3 índices financeiros
- **LossAnalysisCard** permanece (detalhamento ao clicar/expandir)

### Alterações por arquivo

1. **`src/components/dashboard/FinancialSummaryCard.tsx`** (novo) — Card com Margem Operacional, CPM e Taxa de Perda
2. **`src/pages/Index.tsx`** — Condensar KPIs de 6→4, adicionar FinancialSummaryCard, importar useDRE
3. **`src/components/dashboard/index.ts`** — Exportar novo componente

### Dependência

O `useDRE` já existe e calcula `resultadoOperacional`, `receitaLiquida`, `cmv`, `taxasStone`, `despesasFixas`. Será chamado com o mês corrente para alimentar os índices.

