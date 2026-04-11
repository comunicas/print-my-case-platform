

## Alocação Dinâmica de Pré-Estoque ao Detectar Aumento de Estoque

### Conceito

Quando um upload de estoque detecta aumento líquido de itens em um PDV (novo > anterior), o sistema cria **sugestões de alocação pendentes** e notifica o usuário. Na aba Compras, o usuário vê as sugestões e confirma/rejeita cada uma.

### Mudanças

**1. Nova tabela `pending_allocations` (migration)**
- Armazena sugestões geradas automaticamente pelo processamento de estoque
- Campos: `id`, `organization_id`, `upload_id`, `pdv_id`, `product_name`, `suggested_quantity`, `pre_stock_id` (item de compra candidato), `status` (pending/accepted/rejected), `created_at`, `resolved_at`, `resolved_by`
- RLS: admins da org podem ver/atualizar/deletar

**2. Edge Function `process-spreadsheet` — gerar sugestões**
- No bloco onde a dedução automática foi desabilitada (linha 990), reativar a lógica de comparação old vs new stock
- Quando `deletedPreviousRecords > 0` e há aumento líquido por produto:
  - Buscar itens de `pre_stock` pendentes com `product_name` compatível
  - Inserir registros em `pending_allocations` com a quantidade sugerida (mínimo entre aumento e saldo disponível)
  - Criar notificação informando "X sugestões de alocação para PDV Y aguardam confirmação"
- **Não toca** no `pre_stock` diretamente — apenas cria sugestões

**3. Aba Compras — seção de sugestões pendentes**
- Novo componente `PendingAllocations` exibido no topo da aba quando há sugestões
- Card com badge de contagem, mostrando: PDV destino, produto, quantidade sugerida, item de compra relacionado
- Botões "Confirmar" e "Rejeitar" por sugestão, e "Confirmar Todas" em lote
- Ao confirmar: UPDATE no `pre_stock` (deduz saldo, atualiza `allocated_pdv_id`) e marca sugestão como `accepted`
- Ao rejeitar: marca como `rejected`, sem alterar `pre_stock`

**4. Hook `usePendingAllocations`**
- Query para buscar sugestões pendentes da org
- Mutations para aceitar/rejeitar individual e em lote

### Fluxo

```text
Upload estoque → process-spreadsheet detecta aumento
  ↓
Cria pending_allocations + notificação
  ↓
Usuário abre aba Compras → vê banner "3 sugestões de alocação"
  ↓
Confirma/rejeita cada sugestão → pre_stock atualizado
```

### Arquivos afetados
- `supabase/functions/process-spreadsheet/index.ts` — gerar sugestões
- Nova migration — tabela `pending_allocations`
- Novo: `src/hooks/usePendingAllocations.ts`
- Novo: `src/components/upload/PendingAllocations.tsx`
- `src/components/upload/PreStockTab.tsx` — integrar componente de sugestões

### Resultado
- Upload de estoque continua funcionando normalmente
- Quando há aumento, sugestões aparecem para confirmação manual
- PDVs sem estoque anterior (primeiro upload) não geram sugestões falsas
- Usuário mantém controle total sobre alocações

