

## Refatorar Status de Ação para 4 Estados por Quantidade

### Novos estados

| Status | Key | Quantidade | Cor |
|--------|-----|-----------|-----|
| Perfeito | `perfect` | 5+ | Verde |
| Acompanhar | `monitor` | 3-4 | Azul |
| Atenção | `warning` | 1-2 | Laranja |
| Repor | `restock` | 0 | Vermelho |

A lógica antiga considerava vendas e redistribuição. A nova é **puramente baseada na quantidade total** do produto.

### Arquivos a alterar

**1. `src/lib/stockTypes.ts`**
- Mudar `ProductActionStatus` de `'ok' | 'redistribute' | 'restock'` para `'perfect' | 'monitor' | 'warning' | 'restock'`

**2. `src/lib/stockLabels.ts`**
- Atualizar `productActionLabels`: `{ perfect: 'Perfeito', monitor: 'Acompanhar', warning: 'Atenção', restock: 'Repor' }`
- Atualizar `productActionColors` com cores correspondentes (verde, azul, laranja, vermelho)

**3. `src/lib/stockUtils.ts`**
- `getProductActionStatus()`: retornar status baseado em qty (0→restock, 1-2→warning, 3-4→monitor, 5+→perfect)
- `getProductStatus()`: mesma lógica usando `totalQuantity` do produto
- `StockKPIs`: renomear `redistributeProducts` → `warningProducts` ou ajustar campos
- `calculateStockKPIs()`: atualizar filtros de contagem

**4. `src/components/stock/StockFilters.tsx`**
- Atualizar `STATUS_OPTIONS` com os 4 novos valores e cores

**5. `src/components/stock/StockKPICards.tsx`**
- Atualizar KPI de "Redistribuir" para "Atenção" (ou ajustar cards)

**6. `src/components/stock/ProductStockTable.tsx`**
- Atualizar `statusOrder` de ordenação

**7. `src/components/stock/ProductDetailModal.tsx`**
- Atualizar lógica local de status para usar os novos estados

**8. `src/components/stock/ProductSlotsList.tsx`**
- Atualizar tipo de `status` prop

### Sem impacto no banco
Alteração é 100% frontend — os status são calculados em tempo real a partir da quantidade.

