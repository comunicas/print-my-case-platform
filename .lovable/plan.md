

## Verificação do Fluxo Completo — Resultado da Análise

### Status dos Fixes

Todos os 4 fixes estão corretamente implementados no código:

1. **Fix "none" como UUID** — `PreStockForm.tsx` linha 127: `pdvId && pdvId !== "none" ? pdvId : null` ✅
2. **allocated_pdv_id só em alocação total** — Ambas edge functions: `if (newRemaining <= 0) { updateData.allocated_pdv_id = pdvId; }` ✅
3. **Org_id sem fetch duplicado** — `process-spreadsheet` reutiliza `pdvData.organization_id` ✅
4. **Limpeza não deleta stock_history** — Rotina de cleanup só deleta `stock_records` e `uploads` antigos ✅

### Dados Atuais no Banco

- **10 registros de pré-estoque pendentes** (todos com `pdv_id: null`, `allocated_pdv_id: null`)
- **2 registros Motorola alocados** corretamente (com `allocated_pdv_id` = Tietê Plaza Shopping)
- **Estoque atual** presente nos 3 PDVs

### Limitação do Teste

Não é possível testar o fluxo completo de dedução via ferramentas de debug porque:
- A `ingest-stock` requer API key válida
- A `process-spreadsheet` requer upload real de arquivo via UI

### Proposta para Teste Real

Para verificar a dedução parcial sem gravar `allocated_pdv_id`, o usuário precisa:

1. **Fazer upload** de uma planilha de estoque (ex: Boulevard Tatuapé) com quantidade **aumentada** em um produto que tenha pré-estoque pendente (ex: APPLE iPhone 16 Pro, atual=4 no Tatuapé, pré-estoque=14)
2. Se enviar com qty=7, o aumento será 3 (7-4), deduzindo 3 do pré-estoque (14→11)
3. Como `remaining_quantity` (11) > 0, o status permanece `pending` e `allocated_pdv_id` fica `NULL` — validando o fix

Não há mudanças de código necessárias. Os fixes já estão deployados.

