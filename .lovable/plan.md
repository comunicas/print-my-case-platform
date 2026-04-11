

## Testar "Desfazer Alocação" e Adicionar Histórico de Alocações

### 1. Teste do "Desfazer Alocação"
O botão "Desfazer" já está implementado na aba Compras para itens com status "allocated". A funcionalidade restaura `remaining_quantity` ao valor original (`quantity`), limpa `allocated_pdv_id` e retorna o status para "pending". Há 7 itens alocados disponíveis para teste. Vou verificar o fluxo no browser.

### 2. Histórico de Alocações Resolvidas (nova funcionalidade)

**Hook `usePendingAllocations.ts`**
- Adicionar query separada para buscar alocações com status `accepted`, `rejected` ou `undone` (resolvidas), ordenadas por `resolved_at` desc, limitadas a 50

**Componente `PendingAllocations.tsx`**
- Abaixo das sugestões pendentes (ou quando não há pendentes), exibir seção colapsável "Histórico de Alocações"
- Cada linha mostra: produto, PDV, quantidade, status (badge colorido: verde=aceita, vermelho=rejeitada, cinza=desfeita), data de resolução
- Usar `Collapsible` do shadcn para expandir/colapsar

**Hook `usePreStock.ts`**
- No `unallocateItem`, além de atualizar o `pre_stock`, também inserir um registro em `pending_allocations` com status `undone` para registrar a ação no histórico (ou atualizar o registro existente se houver um `pending_allocation` aceito correspondente)

**Migration**
- Nenhuma necessária — a tabela `pending_allocations` já tem campo `status` text que aceita qualquer valor, e `resolved_at`/`resolved_by` para rastreio

### Arquivos afetados
- `src/hooks/usePendingAllocations.ts` — query de histórico
- `src/components/upload/PendingAllocations.tsx` — seção de histórico colapsável
- `src/hooks/usePreStock.ts` — registrar "undone" no histórico ao desfazer

