

## Permitir Sugestões de Alocação no Primeiro Upload de Estoque

### Diagnóstico

O upload `b1b088c8` (ESTOQUE-TATUAPE.xlsx, 24/04 às 05:01) foi processado com sucesso após o PDV ser transferido para a org **RB Digital Tech**, mas **não gerou nenhuma sugestão**. Causa raiz nos logs:

> `First stock upload for PDV — no comparison available`

A edge function `process-spreadsheet` (linha 991) só executa o bloco de pré-estoque quando `deletedPreviousRecords > 0` — ou seja, exige que haja estoque anterior para comparar. Como a transferência entre organizações invalidou o estoque antigo (RLS por org), o sistema tratou como "primeiro upload" e pulou completamente a geração de sugestões.

A org RB tem 13+ itens de pre_stock pendentes (iPhone 13, 14 Plus, 15, 15 Pro, 16 Pro, 17, 17 Pro, etc) que deveriam ter casado com os produtos do upload.

### Mudanças

**1. `supabase/functions/process-spreadsheet/index.ts`**
- Remover a guarda `deletedPreviousRecords > 0` da condição da linha 991. A nova condição deve ser apenas `recordsInserted > 0 && pdvData?.organization_id`.
- Quando não há estoque anterior (primeiro upload ou pós-transferência), tratar todo o estoque novo como "aumento" — ou seja, `oldQty = 0` para todos os produtos (já é o comportamento padrão de `oldStockByProduct[productName] || 0`), o que naturalmente fará o matching com pre_stock pendente.
- Manter toda a lógica de matching exato, deduplicação por `pending_allocations` existentes e por `createdKeys` no batch (já implementada).

**2. Reprocessamento manual do upload existente**
Após o deploy da função corrigida, executar uma query/script pontual que dispare a lógica de sugestões para o upload `b1b088c8-b4d1-478d-8b22-5e041c11addc` sem precisar reenviar a planilha. Duas opções:
   - **Opção A (recomendada)**: rodar uma migration SQL pontual que insere as `pending_allocations` diretamente, fazendo o cruzamento entre `stock_records` desse upload e `pre_stock` pendentes da org RB com matching exato de `product_name`.
   - **Opção B**: criar um endpoint/botão "Reprocessar sugestões" — mais trabalho, mas reaproveitável.

Recomendo Opção A para resolver o caso atual rapidamente; novos uploads daqui em diante usarão a edge function corrigida.

### Resultado esperado

- Próximo upload de estoque do Boulevard Tatuapé (ou qualquer PDV recém-transferido) gerará sugestões automaticamente.
- O upload atual de 24/04 ganhará retroativamente as sugestões na aba **Compras** após a migration.

### Arquivos afetados

- `supabase/functions/process-spreadsheet/index.ts` — remover guarda restritiva
- Migration SQL — popular `pending_allocations` para o upload `b1b088c8`

