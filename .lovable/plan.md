

## Correção: Alocações Incorretas de Pré-Estoque

### Causa Raiz

Na linha 1003 de `process-spreadsheet/index.ts`:
```typescript
const oldQty = oldStockByProduct[productName] || 0;
const increase = Math.max(0, newQty - oldQty);
```

Quando o PDV não tem registros anteriores (`deletedPreviousRecords === 0`), `oldQty` é 0 para tudo. O sistema interpreta todo o estoque como "aumento" e deduz do pré-estoque indevidamente.

### Mudanças

**1. `supabase/functions/process-spreadsheet/index.ts`**
- Condicionar a dedução de pré-estoque a `deletedPreviousRecords > 0` (só comparar quando há estoque anterior real)
- Linha 991: mudar `if (recordsInserted > 0 && pdvData?.organization_id)` para `if (recordsInserted > 0 && pdvData?.organization_id && deletedPreviousRecords > 0)`
- Adicionar log quando pula a dedução: `"Skipping pre-stock deduction: no previous stock records for comparison"`

**2. Migration SQL — Reverter alocações incorretas**
- Resetar os 34 itens alocados incorretamente (todos com `updated_at` em 2026-04-11 02:56–02:57):
  - `remaining_quantity` volta para `quantity` (saldo original)
  - `status` volta para `'pending'`
  - `allocated_pdv_id` volta para `NULL`
- Filtro seguro: `WHERE status = 'allocated' AND updated_at >= '2026-04-11 02:56:00' AND updated_at <= '2026-04-11 02:58:00'`

### Resultado
- Alocações incorretas revertidas — 34 itens voltam a "Pendente"
- Uploads futuros sem estoque anterior não disparam deduções falsas
- Uploads com estoque anterior continuam deduzindo corretamente (comportamento desejado)

