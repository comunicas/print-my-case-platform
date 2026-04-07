

## Corrigir Registros de Pré-Estoque — Reverter para Pendente

### Contexto

Os 3 registros foram marcados como "allocated" incorretamente (pela dedução que usava quantidade total em vez de diferença). Como não devem ser atribuídos a nenhum PDV ainda, precisam voltar ao status "pending" com `remaining_quantity` restaurada.

### Registros afetados

| Produto | Qtd Original | Status Atual | Ação |
|---------|-------------|-------------|------|
| APPLE iPhone 16 Pro | 14 | allocated (remaining: 0) | → pending (remaining: 14) |
| APPLE iPhone 16 Pro Max | 7 | allocated (remaining: 0) | → pending (remaining: 7) |
| APPLE iPhone 14 Pro | 7 | allocated (remaining: 0) | → pending (remaining: 7) |

### Implementação

Executar 3 UPDATEs via ferramenta de inserção (não é migration, é dado):

```sql
UPDATE pre_stock SET status = 'pending', remaining_quantity = quantity, allocated_pdv_id = NULL
WHERE id IN (
  '9abea25b-2814-4d7c-8523-37e4fd74a2cb',
  '11b14d4f-2821-47f5-9b3c-6262c0b8eb42',
  'bcc1d2f9-2671-4ea0-a02b-c4968afec27b'
);
```

### Resultado

- Os 3 registros voltam a aparecer como "Pendente" na aba Compras
- `remaining_quantity` é restaurada ao valor original
- `allocated_pdv_id` fica NULL
- Quando o estoque for atualizado novamente, a dedução inteligente (por diferença) atuará corretamente

