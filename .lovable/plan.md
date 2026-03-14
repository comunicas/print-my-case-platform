

## Verificação do Fuso Horário + Filtro de Visualização Mensal

### Verificação da correção de fuso horário

A correção já está aplicada corretamente nos dois arquivos:
- `dashboardUtils.ts` linha 121, 420, 434: `format(parseISO(...), 'yyyy-MM-dd')` — agrupa por dia local
- `useProductAnalytics.ts`: `getHours()` e `getDay()` — hora/dia local

Vendas noturnas (ex: 22:55 BRT = 01:55 UTC) agora aparecem no dia correto.

### Filtro de Visualização Mensal nos Gráficos

Adicionar um toggle **Diário / Mensal** nos gráficos "Vendas por Dia" e "Perdas por Dia", agregando os dados por mês quando selecionado.

**1. `src/lib/dashboardUtils.ts`** — Novas funções utilitárias:
- `aggregateByMonth(data: SalesByDayData[])`: agrupa dados diários por mês (`yyyy-MM`), somando receita e contagem, formatando como "Mar/26"
- `aggregateLossesByMonth(data: LossesByDayData[])`: mesma lógica para perdas

**2. `src/components/dashboard/SalesByDayChart.tsx`**:
- Adicionar state `viewMode: 'daily' | 'monthly'`
- Toggle com dois botões no header do ChartCard (via `headerBadge` prop)
- Quando `monthly`, usar `aggregateByMonth(data)` em vez do dado diário
- Ajustar título dinamicamente: "Vendas por Dia" / "Vendas por Mês"

**3. `src/components/dashboard/LossesByDayChart.tsx`**:
- Mesmo padrão: toggle diário/mensal com `aggregateLossesByMonth`
- Título dinâmico: "Perdas por Dia" / "Perdas por Mês"

### Comportamento
- Default: Diário (comportamento atual)
- A agregação mensal é feita client-side a partir dos mesmos dados já carregados — sem queries adicionais
- O toggle usa botões compactos (`size="sm"`) estilizados como os period buttons do ProductSalesHistoryChart

