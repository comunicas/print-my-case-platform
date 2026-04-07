

## Adicionar filtro "Total" ao Histórico de Vendas no Modal

### Resumo

Adicionar opção "Total" nos botões de período do gráfico de histórico de vendas, que busca **todas** as vendas do produto sem limite de data.

### Mudanças

**1. Hook `src/hooks/useProductSalesHistory.ts`**

- Aceitar `days` como `number | null` (null = total)
- Quando `days === null`: remover filtros `.gte` e `.lte` da query, usar `eachDayOfInterval` do primeiro ao último registro encontrado
- Para trend: comparar segunda metade vs primeira metade dos dados retornados

**2. Componente `src/components/stock/ProductSalesHistoryChart.tsx`**

- Adicionar `{ label: 'Total', days: null }` ao array `periodOptions`
- Alterar estado `selectedDays` para `number | null`, default continua `15`
- Ajustar `tickInterval` para "Total": calcular dinamicamente baseado na quantidade de pontos (ex: `Math.ceil(data.length / 8)`)

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useProductSalesHistory.ts` | Suportar `days: null` para busca sem limite de data |
| `src/components/stock/ProductSalesHistoryChart.tsx` | Adicionar botão "Total" e ajustar tipo do estado |

