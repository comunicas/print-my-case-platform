

## Adicionar botão "Desfazer Alocação" em itens alocados

### Mudanças

**1. Hook `usePreStock.ts` — nova mutation `unallocateItem`**
- Recebe o `id` do item
- UPDATE no `pre_stock`: `remaining_quantity = quantity`, `status = 'pending'`, `allocated_pdv_id = NULL`
- Invalida queries de `pre_stock`

**2. UI `PreStockTab.tsx` — botão "Desfazer" para itens alocados**
- Na coluna de ações, quando `item.status === "allocated"`, mostrar botão "Desfazer" (ícone de undo)
- Confirmar com AlertDialog antes de executar
- Ao confirmar, chama `unallocateItem` que restaura o item para status pendente com saldo original

### Resultado
- Itens alocados incorretamente podem ser revertidos com um clique
- O saldo volta ao valor original (`quantity`) e o item fica disponível para re-alocação

