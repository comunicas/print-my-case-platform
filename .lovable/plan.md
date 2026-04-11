

## Atualização do Plano — API desabilitada, apenas upload de planilha

### Contexto
A edge function `ingest-stock` permanece desabilitada (retornando 503). A detecção de aumento de estoque e geração de sugestões de alocação funciona **apenas** via upload de planilha (`process-spreadsheet`).

### Estado Atual (já implementado)
1. **`ingest-stock`** — desabilitada, retorna 503
2. **`process-spreadsheet`** — detecta aumento líquido de estoque por produto/PDV e cria registros em `pending_allocations`
3. **`PendingAllocations.tsx`** — exibe sugestões pendentes com aceitar/rejeitar individual e em lote
4. **`usePendingAllocations.ts`** — queries de pendentes e resolvidos, mutations de aceitar/rejeitar
5. **Desfazer alocação** — botão na aba Compras para reverter itens alocados, registra histórico como "undone"
6. **Histórico de alocações** — seção colapsável mostrando alocações aceitas, rejeitadas e desfeitas

### Pendência: Corrigir FK para histórico funcionar
A query de `pending_allocations` falha (HTTP 400) porque o join com `pdvs` usa uma FK que não existe. Necessário:

**Migration** — adicionar foreign key:
```sql
ALTER TABLE pending_allocations 
ADD CONSTRAINT pending_allocations_pdv_id_fkey 
FOREIGN KEY (pdv_id) REFERENCES pdvs(id);
```

### Paginação do histórico
- Usar `usePagination` no hook `usePendingAllocations` para a query de resolvidos
- Integrar `DataPagination` na seção colapsável do histórico

### O que NÃO será feito
- **Não reativar `ingest-stock`** — permanece retornando 503
- **Não adicionar detecção via API** — apenas planilha gera sugestões

### Arquivos afetados
- Nova migration (FK constraint `pending_allocations.pdv_id → pdvs.id`)
- `src/hooks/usePendingAllocations.ts` — paginação no histórico
- `src/components/upload/PendingAllocations.tsx` — UI de paginação
- `.lovable/plan.md` — atualizar com este conteúdo

