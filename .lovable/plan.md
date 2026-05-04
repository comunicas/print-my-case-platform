## Etapa 2 — RPC `ai_get_sales_projection` (versão expandida)

Substituir a função `ai_get_sales_projection(numeric, integer)` criada na Etapa anterior por uma versão mais rica e tornar o parâmetro de meta opcional.

### Mudanças no banco

**Função `public.ai_get_sales_projection(_target_net_per_pdv numeric DEFAULT NULL, _days_baseline integer DEFAULT 90)`** — `CREATE OR REPLACE`, `SECURITY DEFINER`, `search_path=public`.

Retorna por PDV:
- Situação atual: `faturamento_ate_hoje`, `vendas_ate_hoje`, `dias_corridos`, `dias_restantes`.
- Projeção: `projecao_mes` = faturamento até hoje + `fat_por_dia × dias_restantes`.
- `projecao_liquida` = projeção × (1 − taxa_dedução) − despesas do mês.
- Quando `_target_net_per_pdv` for informado: `meta_bruta_necessaria`, `vendas_necessarias` (CEIL), `vendas_por_dia_necessarias`, `gap_projecao_vs_meta`, `status_meta` ∈ {`no_ritmo`, `abaixo_do_ritmo`, `sem_meta_definida`}.

Fontes:
- Baseline: `sales_records` últimos `_days_baseline` dias (`status='Concluído'`).
- Mês atual: `sales_records` desde `date_trunc('month', now())`.
- Despesas: `financial_entries` do mês corrente, isoladas por `get_user_org_id(auth.uid())`.
- Acesso por PDV via `user_can_access_pdv(auth.uid(), pdv_id)`.

`REVOKE EXECUTE … FROM anon, public; GRANT EXECUTE … TO authenticated;`.

### Atualização de metadados da tool

`UPDATE public.ai_agent_tools` para `name='get_sales_projection'`:
- Tornar `target_net_per_pdv` opcional no `parameters_schema` (sem `required`).
- Atualizar `description` explicando os dois modos (com e sem meta) e o significado de `status_meta`.

### Mudanças em `tools.ts`

Em `TOOLS`: ajustar a definição da tool `get_sales_projection`:
- Remover `required: ["meta_liquida_por_pdv"]`.
- Renomear o parâmetro para `target_net_per_pdv` (alinhar com o RPC) e atualizar a description para refletir que ele é opcional.

Em `TOOL_TO_RPC`: ajustar `mapParams` para passar `_target_net_per_pdv: p.target_net_per_pdv ?? null` e `_days_baseline: p.days_baseline ?? 90`.

### Pequena atualização em `skill.ts`

No bloco "Projeção e meta reversa":
- Sem meta informada: chamar `get_sales_projection()` direto para ver projeção e `status_meta='sem_meta_definida'`.
- Com meta: chamar `get_sales_projection(target_net_per_pdv=X)`.
- Mostrar `status_meta` (✅ no ritmo / ⚠️ abaixo do ritmo) na tabela de meta.

### Deploy

Após migration aprovada, redeploy de `ai-agent` para refletir mudanças em `tools.ts`/`skill.ts`. Cache de config do agente (60s) propaga as mudanças em `ai_agent_tools` automaticamente.

## Notas

- Substitui silenciosamente a versão criada na Etapa 1 anterior (mesma assinatura `(numeric, integer)`), então não há risco de coexistência de duas versões.
- `dm.restantes` pode ser 0 no último dia do mês — todas as divisões usam `NULLIF` para evitar erro.
- `gap_projecao_vs_meta` é positivo quando a projeção supera a meta, negativo quando falta.
