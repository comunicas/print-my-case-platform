

## Revisão do Algoritmo de Status do Estoque

### Problemas na lógica atual

**1. "Repor" usa média por slot, não total**
```text
Atual:  avgQuantity (total/slots) <= 2 → restock
Errado: iPhone com 2 slots, 3 unidades (avg 1.5) → "Repor", mas tem 3 unidades
```
O usuário quer: **totalQuantity <= 2** como threshold, não a média.

**2. "Redistribuir" tem branch morto**
```text
Linha 141: hasOutOfStock && !hasLowStock → NUNCA executa
Motivo: se qty=0 (hasOutOfStock=true), então qty<=2 (hasLowStock=true)
         Logo !hasLowStock é sempre false quando hasOutOfStock é true
```

**3. "Redistribuir" deveria significar estoque mal distribuído**
Produto com 1 slot vazio e outro com 5+ unidades = redistribuir (mover unidades entre slots).

### Nova lógica proposta

```text
1. totalQuantity <= 2 + vende     → "Repor"    (pouco estoque, produto vende)
2. totalQuantity <= 2 + não vende → "Ok"       (pouco estoque, mas não vende)
3. hasOutOfStock + totalQuantity > 2 → "Redistribuir" (tem estoque, mas mal distribuído)
4. senão                           → "Ok"
```

| Cenário | Slots | Total | Vendas | Antes | Depois |
|---------|-------|-------|--------|-------|--------|
| iPhone 15 PM | 2 slots (0,1) | 1 | Alta | Repor | Repor ✓ |
| iPhone 15 PM | 2 slots (0,5) | 5 | Alta | Redistribuir | Redistribuir ✓ |
| Galaxy A53 | 1 slot (0) | 0 | Nenhuma | Ok | Ok ✓ |
| Moto G54 | 2 slots (0,3) | 3 | Média | Redistribuir | Redistribuir ✓ |
| iPhone 14 | 1 slot (5) | 5 | Alta | Ok | Ok ✓ |

### Alterações

**`src/lib/stockUtils.ts`** — Reescrever `getProductStatus`:
```typescript
export function getProductStatus(product: ProductStock): ProductActionStatus {
  // Estoque total <= 2: repor se vende, ok se não vende
  if (product.totalQuantity <= 2) {
    if (product.salesIndex === 'none') return 'ok';
    return 'restock';
  }
  // Tem slot vazio mas estoque total > 2: redistribuir
  if (product.hasOutOfStock) return 'redistribute';
  return 'ok';
}
```

Também atualizar `getProductActionStatus` (slot-level) para consistência.

**1 arquivo, ~10 linhas alteradas.**

