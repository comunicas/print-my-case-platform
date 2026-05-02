-- 1) Audit event types
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'ai_agent_config_updated';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'ai_agent_tool_updated';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'ai_agent_tool_toggled';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'ai_agent_config_rollback';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'ai_agent_key_tested';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'ai_agent_smoke_tested';

-- 2) Config table (singleton)
CREATE TABLE IF NOT EXISTS public.ai_agent_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  provider text NOT NULL DEFAULT 'openai',
  model text NOT NULL DEFAULT 'gpt-5-mini',
  system_prompt text NOT NULL,
  reasoning_effort text NOT NULL DEFAULT 'medium',
  max_tool_iterations int NOT NULL DEFAULT 8 CHECK (max_tool_iterations BETWEEN 1 AND 15),
  history_limit int NOT NULL DEFAULT 12 CHECK (history_limit BETWEEN 1 AND 30),
  rate_limit_per_10min int NOT NULL DEFAULT 20 CHECK (rate_limit_per_10min BETWEEN 1 AND 200),
  max_message_chars int NOT NULL DEFAULT 4000 CHECK (max_message_chars BETWEEN 100 AND 10000),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.ai_agent_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view ai agent config"
  ON public.ai_agent_config FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()) OR is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update ai agent config"
  ON public.ai_agent_config FOR UPDATE
  TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert ai agent config"
  ON public.ai_agent_config FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin(auth.uid()));

-- 3) Tools catalog
CREATE TABLE IF NOT EXISTS public.ai_agent_tools (
  name text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT true,
  category text NOT NULL DEFAULT 'general',
  description text NOT NULL,
  parameters_schema jsonb NOT NULL DEFAULT '{"type":"object","properties":{}}'::jsonb,
  handler_name text NOT NULL,
  display_order int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.ai_agent_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view ai agent tools"
  ON public.ai_agent_tools FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()) OR is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage ai agent tools"
  ON public.ai_agent_tools FOR ALL
  TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- 4) Config history (snapshots)
CREATE TABLE IF NOT EXISTS public.ai_agent_config_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity text NOT NULL CHECK (entity IN ('config','tool')),
  entity_key text,
  payload jsonb NOT NULL,
  changed_fields text[] NOT NULL DEFAULT '{}',
  changed_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_agent_config_history_changed_at_idx
  ON public.ai_agent_config_history (changed_at DESC);

ALTER TABLE public.ai_agent_config_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view ai agent history"
  ON public.ai_agent_config_history FOR SELECT
  TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert ai agent history"
  ON public.ai_agent_config_history FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin(auth.uid()));

-- 5) OpenAI key status (no secret stored)
CREATE TABLE IF NOT EXISTS public.ai_agent_key_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  key_prefix text,
  last_tested_at timestamptz,
  last_test_status text CHECK (last_test_status IN ('ok','invalid','quota','error','untested')),
  last_test_message text,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_agent_key_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view ai key status"
  ON public.ai_agent_key_status FOR SELECT
  TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage ai key status"
  ON public.ai_agent_key_status FOR ALL
  TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- 6) Snapshot triggers (write OLD row to history before UPDATE)
CREATE OR REPLACE FUNCTION public.ai_agent_snapshot_config()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  changed text[] := '{}';
BEGIN
  IF NEW.system_prompt IS DISTINCT FROM OLD.system_prompt THEN changed := array_append(changed, 'system_prompt'); END IF;
  IF NEW.model IS DISTINCT FROM OLD.model THEN changed := array_append(changed, 'model'); END IF;
  IF NEW.reasoning_effort IS DISTINCT FROM OLD.reasoning_effort THEN changed := array_append(changed, 'reasoning_effort'); END IF;
  IF NEW.max_tool_iterations IS DISTINCT FROM OLD.max_tool_iterations THEN changed := array_append(changed, 'max_tool_iterations'); END IF;
  IF NEW.history_limit IS DISTINCT FROM OLD.history_limit THEN changed := array_append(changed, 'history_limit'); END IF;
  IF NEW.rate_limit_per_10min IS DISTINCT FROM OLD.rate_limit_per_10min THEN changed := array_append(changed, 'rate_limit_per_10min'); END IF;
  IF NEW.max_message_chars IS DISTINCT FROM OLD.max_message_chars THEN changed := array_append(changed, 'max_message_chars'); END IF;

  IF array_length(changed, 1) IS NOT NULL THEN
    INSERT INTO public.ai_agent_config_history (entity, entity_key, payload, changed_fields, changed_by)
    VALUES ('config', 'singleton', to_jsonb(OLD), changed, NEW.updated_by);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ai_agent_config_snapshot ON public.ai_agent_config;
CREATE TRIGGER trg_ai_agent_config_snapshot
  BEFORE UPDATE ON public.ai_agent_config
  FOR EACH ROW EXECUTE FUNCTION public.ai_agent_snapshot_config();

CREATE OR REPLACE FUNCTION public.ai_agent_snapshot_tool()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  changed text[] := '{}';
BEGIN
  IF NEW.enabled IS DISTINCT FROM OLD.enabled THEN changed := array_append(changed, 'enabled'); END IF;
  IF NEW.description IS DISTINCT FROM OLD.description THEN changed := array_append(changed, 'description'); END IF;
  IF NEW.parameters_schema IS DISTINCT FROM OLD.parameters_schema THEN changed := array_append(changed, 'parameters_schema'); END IF;
  IF NEW.category IS DISTINCT FROM OLD.category THEN changed := array_append(changed, 'category'); END IF;

  IF array_length(changed, 1) IS NOT NULL THEN
    INSERT INTO public.ai_agent_config_history (entity, entity_key, payload, changed_fields, changed_by)
    VALUES ('tool', OLD.name, to_jsonb(OLD), changed, NEW.updated_by);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ai_agent_tool_snapshot ON public.ai_agent_tools;
CREATE TRIGGER trg_ai_agent_tool_snapshot
  BEFORE UPDATE ON public.ai_agent_tools
  FOR EACH ROW EXECUTE FUNCTION public.ai_agent_snapshot_tool();

-- 7) Seed config (singleton)
INSERT INTO public.ai_agent_config (
  singleton, provider, model, reasoning_effort,
  max_tool_iterations, history_limit, rate_limit_per_10min, max_message_chars,
  system_prompt
) VALUES (
  true, 'openai', 'gpt-5-mini', 'medium',
  8, 12, 20, 4000,
$SKILL$Você é o **Assistente IA Operacional do Print My Case**, um copiloto para gestores e administradores de uma rede multi-PDV (Pontos de Venda) de capinhas personalizadas.

## Sua missão
Ajudar o usuário a:
1. Entender vendas e faturamento (resumo, top produtos, comparação entre PDVs).
2. Diagnosticar e otimizar **estoque** entre PDVs, sugerindo **redistribuição** de produtos do PDV com excedente para o PDV em ruptura.
3. Acompanhar compras pendentes (pré-estoque) e DRE simplificado.

## Regras inegociáveis
- **NUNCA invente números.** Se você não chamou uma tool para obter o dado, diga "vou consultar" e chame a tool.
- **Sempre use as tools** para qualquer pergunta sobre estoque, vendas, faturamento, compras ou redistribuição.
- **Apenas vendas com status "Concluído"** entram em faturamento e top produtos. Nunca some vendas pendentes/canceladas.
- **Você só vê dados da organização e PDVs do próprio usuário.** Não fale de outras organizações.
- Se a tool retornar lista vazia ou números zerados, diga isso de forma direta — não invente justificativas.
- **Resolução de PDV por nome é obrigatória antes de `pdv_ids`:** se o usuário citar PDV por nome/local (ex.: "Tietê"), chame `get_pdv_list` **antes** de qualquer tool que receba `pdv_ids`.
- No mapeamento de nomes de PDV, compare de forma **case-insensitive** e com **remoção de acentos**.
- Se houver ambiguidade de nome de PDV (mais de um candidato), **peça desambiguação ao usuário** antes de seguir.
- Só chame `get_stock_overview`/`get_zero_stock_items` com `pdv_ids` quando tiver UUID(s) válido(s) resolvido(s) pelo `get_pdv_list`.

## Política de redistribuição
- Use `get_stock_redistribution_suggestions` sempre que o usuário pedir "otimizar estoque", "balancear PDVs", "onde mover", "transferir produtos".
- Cobertura = estoque atual ÷ média diária de vendas (últimos 30d).
- Só sugerir transferência quando o destino tem cobertura **< 7 dias** E a origem mantém cobertura **≥ 7 dias** após retirar.
- Apresente sempre: produto, PDV origem, PDV destino, quantidade sugerida, prioridade (high/med/low), justificativa.

## Produtos zerados e análise de reposição
- Para "produtos zerados", "em ruptura", "sem estoque em algum PDV": use `get_zero_stock_items`.
- Quando o usuário pedir "analise os faltantes acima": use `analyze_restock_targets` passando os product_names EXATOS da resposta anterior.
- Para verificar compras pendentes de SKUs específicos, use `get_purchases_summary` com `product_names` EXATOS.

## Tratamento de erros de tools
- Se uma tool falhar, **NUNCA** mostre a mensagem técnica ao usuário. Diga: "Não consegui calcular isso agora. Tente novamente em instantes ou refine a pergunta."

## Formato de resposta
- **Markdown direto e enxuto.** Use tabelas para listas com 3+ colunas. Use bullets para destaques.
- Comece com a resposta. Depois, no máximo, **uma frase de insight**.
- Valores em BRL: R$ 1.234,56. Datas: dd/mm/yyyy.

## Status canônicos
Vendas: Concluído | Cancelado | Pendente | Reembolsado.
Pagamentos: Cartão de Crédito | Cartão de Débito | PIX.$SKILL$
)
ON CONFLICT (singleton) DO NOTHING;

-- 8) Seed tools
INSERT INTO public.ai_agent_tools (name, enabled, category, description, parameters_schema, handler_name, display_order) VALUES
('get_stock_overview', true, 'stock',
 'Retorna visão geral do estoque agregada por produto e PDV. Use quando o usuário pergunta sobre estoque atual ou quantidade de um produto.',
 '{"type":"object","properties":{"pdv_ids":{"type":"array","items":{"type":"string"},"description":"Filtrar por PDVs específicos (UUIDs). Omitir = todos."},"limit":{"type":"integer","default":100,"maximum":200},"product_name":{"type":"string","description":"Filtro opcional por nome (ILIKE)."}}}'::jsonb,
 'ai_get_stock_overview', 10),
('get_stock_redistribution_suggestions', true, 'stock',
 'Sugere transferências entre PDVs, priorizando destinos com baixa cobertura e origens com excedente. Use para otimizar/balancear estoque.',
 '{"type":"object","properties":{"min_coverage_days":{"type":"integer","default":7},"limit":{"type":"integer","default":20,"maximum":50},"product_name":{"type":"string"}}}'::jsonb,
 'ai_get_stock_redistribution_suggestions', 20),
('get_sales_summary', true, 'sales',
 'Resumo de vendas (faturamento, deduções, ticket médio, vendas no cartão). Apenas vendas Concluído.',
 '{"type":"object","properties":{"start":{"type":"string","format":"date-time"},"end":{"type":"string","format":"date-time"},"pdv_ids":{"type":"array","items":{"type":"string"}}},"required":["start","end"]}'::jsonb,
 'ai_get_sales_summary', 30),
('get_top_products', true, 'sales',
 'Top produtos mais vendidos por contagem em um período. Apenas vendas Concluído.',
 '{"type":"object","properties":{"start":{"type":"string","format":"date-time"},"end":{"type":"string","format":"date-time"},"pdv_ids":{"type":"array","items":{"type":"string"}},"limit":{"type":"integer","default":10,"maximum":30}},"required":["start","end"]}'::jsonb,
 'ai_get_top_products', 40),
('get_low_stock_alerts', true, 'stock',
 'Lista produtos com estoque ≤ threshold E demanda > 0 (exclui produtos estagnados).',
 '{"type":"object","properties":{"threshold":{"type":"integer","default":2},"limit":{"type":"integer","default":50,"maximum":100}}}'::jsonb,
 'ai_get_low_stock_alerts', 50),
('get_pdv_comparison', true, 'sales',
 'Compara faturamento, vendas e ticket médio por PDV em um período.',
 '{"type":"object","properties":{"start":{"type":"string","format":"date-time"},"end":{"type":"string","format":"date-time"}},"required":["start","end"]}'::jsonb,
 'ai_get_pdv_comparison', 60),
('get_purchases_summary', true, 'purchases',
 'Resumo de compras pendentes (pré-estoque). Útil para planejar reposição.',
 '{"type":"object","properties":{"start":{"type":"string","format":"date-time"},"end":{"type":"string","format":"date-time"},"limit":{"type":"integer","default":50,"maximum":100},"product_names":{"type":"array","items":{"type":"string"}}}}'::jsonb,
 'ai_get_purchases_summary', 70),
('get_financial_summary', true, 'financial',
 'DRE simplificado: faturamento - deduções - despesas = resultado.',
 '{"type":"object","properties":{"start":{"type":"string","format":"date-time"},"end":{"type":"string","format":"date-time"}},"required":["start","end"]}'::jsonb,
 'ai_get_financial_summary', 80),
('get_zero_stock_items', true, 'stock',
 'Lista produtos com estoque ZERADO em algum PDV. Diferencia ruptura local vs ruptura na rede inteira.',
 '{"type":"object","properties":{"pdv_ids":{"type":"array","items":{"type":"string"}},"limit":{"type":"integer","default":100,"maximum":200}}}'::jsonb,
 'ai_get_zero_stock_items', 90),
('analyze_restock_targets', true, 'stock',
 'Para uma lista exata de produtos faltantes, retorna a melhor decisão por item: transferir, aguardar_compra, comprar, sem_acao_segura ou sem_dados_suficientes.',
 '{"type":"object","properties":{"product_names":{"type":"array","items":{"type":"string"}},"min_coverage_days":{"type":"integer","default":7},"target_coverage_days":{"type":"integer","default":14}},"required":["product_names"]}'::jsonb,
 'ai_analyze_restock_targets', 100),
('get_pdv_list', true, 'general',
 'Retorna a lista de todos os PDVs da organização com seus IDs e nomes. Pré-passo obrigatório quando o usuário citar PDV por nome/local: resolva nomes com comparação case-insensitive e sem acentos, desambigue se necessário e só então passe UUID(s) válidos em tools com pdv_ids.',
 '{"type":"object","properties":{}}'::jsonb,
 'ai_get_pdv_list', 110)
ON CONFLICT (name) DO NOTHING;

-- 9) Seed key status row
INSERT INTO public.ai_agent_key_status (singleton, last_test_status)
VALUES (true, 'untested')
ON CONFLICT (singleton) DO NOTHING;