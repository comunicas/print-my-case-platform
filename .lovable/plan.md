

## Ajuste da Tabela de Estoque — Coluna Slot + Reordenação

### Mudança

Adicionar coluna "Slot" mostrando os números dos slots separados por vírgula (ex: `3, 5, 8`) e reordenar as colunas para: **Slot → Produto → Status → Vendas → Estoque → Slots → Ações**.

### Arquivo: `src/components/stock/ProductStockTable.tsx`

**Header (TableHeader)** — Nova ordem:
1. **Slot** (novo, sortável pelo primeiro slot)
2. **Produto** (existente)
3. **Status** (existente)
4. **Vendas** (existente)
5. **Estoque** (existente)
6. **Slots** (existente — quantidade de slots)
7. **Ações** (botão Eye, existente)

**Body (TableRow)** — Reordenar células na mesma sequência:
1. Slot: `product.slots.map(s => s.slotNumber).join(', ')` em `<span className="font-mono text-sm">`
2. Produto: `ProductDisplay` com link (existente)
3. Status: Badge com `productActionLabels` (existente)
4. Vendas: ShoppingCart + Badge salesIndex (existente)
5. Estoque: Progress bar + quantidade (existente)
6. Slots: `product.slots.length` (existente)
7. Ações: botão Eye (existente)

**Sort** — Adicionar `'slot'` ao tipo `SortField` e no switch de ordenação:
```typescript
case 'slot':
  comparison = (a.slots[0]?.slotNumber || '').localeCompare(b.slots[0]?.slotNumber || '', undefined, { numeric: true });
```

