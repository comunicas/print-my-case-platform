-- Backfill for environments that already ran 20260430080419 migration.
-- Ensures the latest PDV lookup guidance and tool seed are applied via forward-only migration.

UPDATE public.ai_agent_config
SET system_prompt = rtrim(system_prompt) || E'
- **Resolução de PDV por nome é obrigatória antes de `pdv_ids`:** se o usuário citar PDV por nome/local (ex.: "Tietê"), chame `get_pdv_list` **antes** de qualquer tool que receba `pdv_ids`.
- No mapeamento de nomes de PDV, compare de forma **case-insensitive** e com **remoção de acentos**.
- Se houver ambiguidade de nome de PDV (mais de um candidato), **peça desambiguação ao usuário** antes de seguir.
- Só chame `get_stock_overview`/`get_zero_stock_items` com `pdv_ids` quando tiver UUID(s) válido(s) resolvido(s) pelo `get_pdv_list`.'
WHERE singleton = true
  AND system_prompt NOT LIKE '%Resolução de PDV por nome é obrigatória antes de `pdv_ids`%';

INSERT INTO public.ai_agent_tools (name, enabled, category, description, parameters_schema, handler_name, display_order)
VALUES (
  'get_pdv_list',
  true,
  'general',
  'Retorna a lista de todos os PDVs da organização com seus IDs e nomes. Pré-passo obrigatório quando o usuário citar PDV por nome/local: resolva nomes com comparação case-insensitive e sem acentos, desambigue se necessário e só então passe UUID(s) válidos em tools com pdv_ids.',
  '{"type":"object","properties":{}}'::jsonb,
  'ai_get_pdv_list',
  110
)
ON CONFLICT (name) DO UPDATE
SET
  enabled = EXCLUDED.enabled,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  parameters_schema = EXCLUDED.parameters_schema,
  handler_name = EXCLUDED.handler_name,
  display_order = EXCLUDED.display_order;
