## Etapa 1 — Adicionar filtro `_pdv_ids` em 3 RPCs do agente IA

### Arquivos

**Novo:** `supabase/migrations/{timestamp}_fix_ai_rpcs_pdv_filter.sql`

**Editar:** `supabase/functions/ai-agent/tools.ts` (expor o novo parâmetro nas 3 tools).

---

### 1) Migration SQL

Para cada função: `DROP FUNCTION` da assinatura antiga, recriar com `_pdv_ids uuid[] DEFAULT NULL` e o novo predicado `AND (_pdv_ids IS NULL OR <campo>.pdv_id = ANY(_pdv_ids))`. Mantém `LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'`, todos os helpers (`user_can_access_pdv`, `get_user_org_id`) e o `RETURNS TABLE` original. Reaplicar `REVOKE` de `anon, public` e `GRANT EXECUTE` para `authenticated`.

**1.a `ai_get_low_stock_alerts(_threshold, _limit, _pdv_ids)`** — `RETURNS TABLE(product_name text, pdv_name text, total_quantity bigint, vendas_30d bigint)` (mantém `bigint`, já que é o tipo atual no banco; o prompt pediu `numeric` mas alterar isso quebraria callers — confirmo `bigint`). Adiciona o filtro em **ambas** CTEs (`stock_agg` no `sr.pdv_id` e `sales_agg` no `s.pdv_id`) para que o resultado fique coerente.

**1.b `ai_get_pdv_comparison(_start, _end, _pdv_ids)`** — `RETURNS TABLE(pdv_name text, sales_count bigint, revenue numeric, ticket_medio numeric)` (ordem real do banco; o prompt invertia revenue/sales_count — mantenho a ordem existente para não quebrar consumidores). Filtro adicionado no `WHERE` ao lado de `s.status = 'Concluído'`.

**1.c `ai_get_financial_entries(_reference_month, _pdv_ids, _limit)`** — substitui `_pdv_id uuid` por `_pdv_ids uuid[]`. Troca `(_pdv_id IS NULL OR fe.pdv_id = _pdv_id)` por `(_pdv_ids IS NULL OR fe.pdv_id = ANY(_pdv_ids))`. Demais SQL (joins, group by, order by, limit) permanece idêntico.

---

### 2) `supabase/functions/ai-agent/tools.ts`

- **`get_low_stock_alerts`**: adicionar em `parameters.properties`:
  ```
  pdv_ids: { type: "array", items: { type: "string" }, description: "Filtrar por PDVs específicos (UUIDs). Omitir = todos." }
  ```
  e em `TOOL_TO_RPC.get_low_stock_alerts.mapParams`: incluir `_pdv_ids: p.pdv_ids ?? null`.

- **`get_pdv_comparison`**: mesma adição de `pdv_ids` nas properties; `mapParams` passa a enviar `_pdv_ids: p.pdv_ids ?? null`.

- **`get_financial_entries`**: renomear o campo `pdv_id` (string) para `pdv_ids` (array of string) nas properties, atualizar a description ("Lista de UUIDs de PDV para filtrar"), e em `mapParams` enviar `_pdv_ids: p.pdv_ids ?? null` em vez de `_pdv_id`.

---

### 3) Sem alterações em `skill.ts`

Os formatos canônicos e intenções já existentes continuam válidos — apenas ganham capacidade de filtro por PDV via parâmetro. Documentação de skill pode ser ajustada num passo futuro se necessário.

### Validação manual após deploy

- "alertas de baixo estoque no PDV X" → resposta limitada ao PDV.
- "compare os PDVs A e B em abril" → tabela só com A e B.
- "despesas de maio nos PDVs A e B" → entries filtradas por array.
- Chamadas sem `pdv_ids` continuam funcionando (default `NULL` = todos).
