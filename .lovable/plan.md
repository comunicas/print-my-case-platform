

## Adicionar Logs de Sucesso na Edge Function ingest-stock

### Problema

Os logs da `ingest-stock` mostram apenas "booted" e "shutdown" — sem nenhuma mensagem de sucesso ou contexto, dificultando o monitoramento.

### Alteração

**`supabase/functions/ingest-stock/index.ts`** — Adicionar `console.log` em pontos-chave:

1. Após autenticação da API key: log do `organization_id`
2. Após resolver o PDV: log do `pdv.id` e `deviceId`
3. Após insert com sucesso: log resumido com `pdv_id`, `slot_number`, `product_name`, `quantity`, `records_deleted`
4. Após atualizar `stock_history`: log da marca e totais agregados

Formato dos logs: `[ingest-stock] <ação> | key=value` para facilitar busca nos logs.

