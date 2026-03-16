

## Unificar Lógica de Alertas de Estoque (Home + Estoque)

### Problema

A Home mostra alertas para slots com 0-1 unidades **independente de vendas**. Isso contradiz a lógica corrigida na página de Estoque, onde produtos sem vendas são "Ok" mesmo com estoque baixo.

### Proposta

Atualizar `getLowStockItems` em `dashboardUtils.ts` para excluir itens com `salesIndex === 'none'`, alinhando com a lógica de `getProductStatus`.

### Alteração

**`src/lib/dashboardUtils.ts`** — função `getLowStockItems` (linha 321-337):

Adicionar filtro para excluir itens sem vendas:

```typescript
export function getLowStockItems(
  slots: { slotNumber: string; productName: string; brand: string; quantity: number; pdvName?: string }[],
  salesByProduct: Map<string, number>,
  threshold: number = 1
): LowStockItem[] {
  return slots
    .filter(slot => slot.quantity <= threshold)
    .map(slot => {
      const salesCount = salesByProduct.get(slot.productName) || 0;
      return {
        slotNumber: slot.slotNumber,
        productName: slot.productName,
        brand: slot.brand,
        quantity: slot.quantity,
        pdvName: slot.pdvName,
        salesCount,
        salesIndex: getSalesIndex(salesCount),
      };
    })
    .filter(item => item.salesIndex !== 'none')  // ← Nova linha: exclui itens sem vendas
    .sort((a, b) => a.quantity - b.quantity);
}
```

### Impacto

- KPI "Estoque Crítico" na Home reduz (apenas produtos que vendem)
- Tabela de alertas fica consistente com a página de Estoque
- 1 arquivo, 1 linha adicionada

