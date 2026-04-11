

## Desabilitar API de Estoque e Adicionar Confirmação Manual de Alocação

### Verificação (concluída)
- 51 itens pendentes com saldo integral (224 unidades)
- 2 itens alocados legitimamente (Motorolas)
- Estado correto

### Mudanças

**1. Desabilitar ingest-stock (`supabase/functions/ingest-stock/index.ts`)**
- Adicionar retorno imediato no início da função com status 503 e mensagem "Ingestão de estoque via API temporariamente desativada"
- Manter o código existente intacto (comentado ou após o return) para reativação futura

**2. Remover dedução automática de pré-estoque do process-spreadsheet (`supabase/functions/process-spreadsheet/index.ts`)**
- Remover o bloco de dedução automática (linhas 990-1047)
- Substituir por log informativo: "Pre-stock auto-deduction disabled — requires manual confirmation"
- Upload de estoque continua funcionando normalmente (stock_records, stock_history), apenas não toca no pre_stock

**3. Criar tela de confirmação manual na aba Compras**
- Adicionar botão "Alocar" em cada item pendente do pré-estoque
- Modal de alocação com:
  - Seletor de PDV (destino da alocação)
  - Quantidade a alocar (default: remaining_quantity)
  - Botão confirmar
- Ao confirmar: UPDATE no pre_stock com remaining_quantity reduzida, allocated_pdv_id e status ajustados
- Permitir alocação parcial (alocar parte do saldo para um PDV)

### Arquivos afetados
- `supabase/functions/ingest-stock/index.ts` — desabilitar
- `supabase/functions/process-spreadsheet/index.ts` — remover auto-dedução
- `src/components/upload/PreStockTab.tsx` — adicionar botão e modal de alocação manual
- `src/hooks/usePreStock.ts` — adicionar mutation de alocação manual

### Resultado
- API de estoque desativada (retorna 503)
- Uploads de planilha funcionam mas não alocam automaticamente
- Usuário controla manualmente quando e para qual PDV alocar cada compra

