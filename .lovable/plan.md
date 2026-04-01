

## Correção de Cores e Legenda do Mapa de Estoque

### Verificação dos filtros

O filtro "Status da Venda" foi removido com sucesso. Os filtros restantes (PDV, Busca, Marca, Status de ação, Índice de vendas) estão presentes e corretamente conectados ao contexto.

### Problemas visuais a corrigir

| Problema | Onde |
|----------|------|
| `medium` e `low` usam mesma cor (`bg-yellow-500`) | `stockLabels.ts` linha 36-37 |
| `low` ausente da legenda | `StockLegend.tsx` linha 10 |
| Badge de quantidade não diferencia `medium` vs `low` | `stockGridUtils.ts` linha 57 |

### Alterações

**1. `src/lib/stockLabels.ts`** — Diferenciar cores
- `medium`: mudar de `bg-yellow-500` para `bg-lime-500`
- `low`: manter `bg-yellow-500`

Gradação: verde (cheio) → lima (médio) → amarelo (baixo) → laranja (crítico) → vermelho (vazio)

**2. `src/components/stock/StockLegend.tsx`** — Adicionar `low` à legenda
- Mudar `LEGEND_STATUSES` de `['full', 'medium', 'critical', 'empty', 'inactive']` para `['full', 'medium', 'low', 'critical', 'empty', 'inactive']`

**3. `src/lib/stockGridUtils.ts`** — Sincronizar badge de quantidade
- Adicionar faixa intermediária: qty 3-5 → `bg-yellow-500` (low), qty 6 → `bg-lime-500` (medium)
```typescript
if (quantity <= STOCK_THRESHOLDS.CRITICAL) return 'bg-orange-500';
if (quantity <= STOCK_THRESHOLDS.LOW) return 'bg-yellow-500';
if (quantity < MAX_CAPACITY) return 'bg-lime-500';
return 'bg-green-500';
```

### Resultado

6 níveis visuais distintos na legenda e no mapa, cada um com cor única.

