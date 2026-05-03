## Objetivo
Adicionar 4 novas capacidades ao Agente IA cobrindo gaps operacionais: listagem de PDVs, pré-estoque detalhado, despesas por PDV/categoria e breakdown por forma de pagamento.

## Arquivos a editar/criar

1. **`supabase/functions/ai-agent/tools.ts`** — adicionar 4 entradas em `TOOLS` + 4 em `TOOL_TO_RPC`, e corrigir a description de `get_top_products`.
2. **`supabase/functions/ai-agent/skill.ts`** — atualizar `SKILL_CORE` com novas intenções e formatos canônicos.
3. **3 novas migrations SQL** em `supabase/migrations/`:
   - `add_ai_get_pre_stock_detail.sql`
   - `add_ai_get_financial_entries.sql`
   - `add_ai_get_payment_breakdown.sql`

(A função `ai_get_pdv_list` já existe no banco — só precisa ser exposta em `tools.ts`.)

## Etapa 1 — Wire-up `ai_get_pdv_list` + correção `get_top_products`
Em `tools.ts`:
- Inserir tool `get_pdv_list` (sem parâmetros) → RPC `ai_get_pdv_list` com `mapParams: () => ({})`.
- Substituir a description de `get_top_products` para deixar explícito que retorna `sales_count` e `revenue` (habilitando coluna "Valor acumulado").

## Etapa 2 — `ai_get_pre_stock_detail`
- Migration cria função `SECURITY DEFINER` agregando `pre_stock` por `product_name + status`, com totais comprado/disponível, custo unit/total, PDV alocado e observações; filtro por `organization_id = get_user_org_id(auth.uid())`. REVOKE de anon/public, GRANT a authenticated.
- Tool `get_pre_stock_detail(status?, limit?)` → RPC `ai_get_pre_stock_detail`.
- `skill.ts`: nova intenção em "Planejamento" + formato canônico (Produto | Status | Disponível | Comprado | Custo unit. | Custo total).

## Etapa 3 — `ai_get_financial_entries`
- Migration cria função agregando `financial_entries` por PDV/categoria/mês com `LEFT JOIN pdvs` (mostrando "Geral / Sem PDV" quando `pdv_id IS NULL`). Parâmetros: `_reference_month text` (YYYY-MM), `_pdv_id uuid`, `_limit int`. Acesso por org via `get_user_org_id(auth.uid())`.
- Tool `get_financial_entries(reference_month?, pdv_id?, limit?)` → RPC `ai_get_financial_entries`.
- `skill.ts`: intenção em "Diagnósticas e comparativas" combinando com `get_financial_summary` para DRE por PDV + formato canônico.

## Etapa 4 — `ai_get_payment_breakdown`
- Migration cria função com CTE `pdv_totais` para calcular `pct_do_pdv`, agrupando `sales_records` por PDV + `payment_method`, filtrando `status = 'Concluído'` e `order_time BETWEEN _start AND _end`. Acesso via `user_can_access_pdv(auth.uid(), pdv_id)` + filtro opcional `_pdv_ids uuid[]`.
- Tool `get_payment_breakdown(start, end, pdv_ids?)` → RPC `ai_get_payment_breakdown`.
- `skill.ts`: intenção em "Vendas e faturamento" + formato canônico (PDV | Forma | Vendas | Faturamento | %).

## Padrões aplicados em todas as migrations
- `LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'`.
- `REVOKE EXECUTE ... FROM anon, public; GRANT EXECUTE ... TO authenticated;`.
- Acesso isolado por org/PDV via helpers existentes (`get_user_org_id`, `user_can_access_pdv`) — RLS-equivalente.

## Deploy
A edge function `ai-agent` será redeployada automaticamente após as edições em `tools.ts` e `skill.ts`. Migrations rodam via fluxo de aprovação.

## Validação manual após deploy
- "quais PDVs temos ativos?" → lista com status.
- "top 5 produtos com valor acumulado" → coluna "Valor acumulado" preenchida em R$.
- "o que temos disponível no pré-estoque?" → tabela com colunas obrigatórias.
- "quais foram as despesas de maio de 2026?" → breakdown por PDV/categoria.
- "breakdown de formas de pagamento últimos 30 dias" → tabela PIX vs cartão por PDV com %.
