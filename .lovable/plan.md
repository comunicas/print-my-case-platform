## Objetivo

Permitir que o agente IA responda perguntas de projeção e meta reversa do tipo "para faturar líquido R$ X em cada PDV, quanto preciso vender este mês?". Hoje falha porque faltam dados consolidados (ticket médio, taxa de dedução, despesas mensais) e instruções de raciocínio.

## Etapas

### Etapa 1 — RPC `ai_get_pdv_metrics` (migration SQL)

Cria função `public.ai_get_pdv_metrics(_days integer DEFAULT 90)` que retorna por PDV:
- `pdv_nome`, `dias_analisados`, `total_vendas`, `faturamento_total`
- `ticket_medio`, `vendas_por_dia`, `faturamento_por_dia`
- `taxa_deducao_pct` (calc: 100 * SUM(refund+discount) / SUM(amount))
- `despesas_mes_medio` (de `financial_entries`, normalizado para mês)

Filtros: apenas vendas `status='Concluído'`, respeitando `user_can_access_pdv` e `get_user_org_id`. SECURITY DEFINER, search_path=public, REVOKE de anon/public, GRANT a authenticated.

### Etapa 2 — RPC `ai_get_sales_projection` (migration SQL)

Cria função que calcula:
- Projeção do mês corrente: `faturamento_atual` + (`vendas_por_dia` * dias_restantes)
- Meta reversa: `meta_bruta = (meta_liquida + despesas_mes_medio) / (1 - taxa_deducao_pct/100)`
- `vendas_necessarias = meta_bruta / ticket_medio`
- `vendas_por_dia_necessarias = vendas_necessarias / dias_restantes_no_mes`
- `gap_vs_ritmo_atual = vendas_por_dia_necessarias - vendas_por_dia`

Parâmetros: `_meta_liquida_por_pdv numeric`, `_days_baseline integer DEFAULT 90`. Mesmas regras de segurança.

### Etapa 3 — Registrar tools em `tools.ts` e `ai_agent_tools`

Em `supabase/functions/ai-agent/tools.ts`:
- Adicionar entradas `get_pdv_metrics` e `get_sales_projection` em `TOOLS` com schemas adequados.
- Adicionar mapeamentos em `TOOL_TO_RPC` para os RPCs criados.

Migration SQL adicional: INSERT idempotente (`ON CONFLICT (name) DO UPDATE`) em `ai_agent_tools` para as 2 novas tools com `enabled=true`, categoria `analytics`, descrição e `parameters_schema` consistentes.

### Etapa 4 — Expandir `skill.ts` com fluxo de projeção/meta

Em `supabase/functions/ai-agent/skill.ts`, adicionar bloco `SKILL_CORE` para perguntas de "meta", "projeção", "para faturar X líquido":
1. Chamar `get_pdv_metrics(90)` para baseline.
2. Se a pergunta for meta reversa, chamar `get_sales_projection(meta_liquida)`.
3. Resposta deve mostrar por PDV: ritmo atual, meta bruta calculada, vendas necessárias/dia, gap. Tabela markdown.
4. Explicitar a fórmula usada: `meta_bruta = (meta_liquida + despesas) / (1 - taxa_deducao)`.

### Etapa 5 — Corrigir model padrão em `index.ts`

Em `supabase/functions/ai-agent/index.ts`, trocar fallback `DEFAULT_MODEL = "gpt-5-mini"` por modelo válido suportado pelo Lovable AI Gateway. **Confirmar antes de aplicar**: validar qual modelo está em `ai_agent_config.model` em produção e qual está realmente disponível. Candidatos: `google/gemini-2.5-flash` (rápido/barato) ou `openai/gpt-5-mini` (se prefixo openai/ estiver correto). Não aplicar a troca para `gpt-4o-mini` cega — esse modelo não está na lista de suportados do Lovable AI.

### Etapa 6 — Deploy e verificação

- Deploy de `ai-agent` edge function.
- Verificar via `supabase--read_query`:
  - `ai_agent_tools` contém 21 entradas habilitadas.
  - `ai_get_pdv_metrics()` e `ai_get_sales_projection(5000)` retornam linhas para org de teste.
- Smoke test no chat: "para faturar líquido 5 mil por PDV este mês, quanto preciso vender?" deve produzir tabela com meta bruta, vendas/dia e gap.

## Notas técnicas

- `financial_entries.reference_month` é `date` (sempre dia 1 do mês). O cálculo `despesas_mes_medio` divide pelo número de meses no janela (`_days/30`), não pelo número de entries.
- `taxa_deducao_pct` usa `NULLIF(SUM(amount),0)` para evitar divisão por zero — retorna NULL → COALESCE para 0.
- `dias_restantes_no_mes` em `ai_get_sales_projection`: `EXTRACT(DAY FROM (date_trunc('month', now()) + interval '1 month' - interval '1 day')) - EXTRACT(DAY FROM now()) + 1`.
- Filtro `WHERE v.total_vendas IS NOT NULL` no `ai_get_pdv_metrics` exclui PDVs sem vendas no período (evita ruído).
- Cache de config do agente é 60s — após deploy, mudanças em `ai_agent_tools` levam até 1min para propagar.

## Riscos

- **Modelo inválido (Etapa 5)**: aplicar nome errado quebra todas as conversas. Verificar config atual antes da troca; se incerto, abrir questão ao usuário em vez de aplicar.
- **RLS em `financial_entries`**: o RPC usa `get_user_org_id(auth.uid())` no WHERE, garantindo isolamento mesmo com SECURITY DEFINER.
