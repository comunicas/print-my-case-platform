-- ============================================================
-- 1. Extensão pgvector
-- ============================================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- 2. ai_conversations
-- ============================================================
CREATE TABLE public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_org_id ON public.ai_conversations(organization_id);
CREATE INDEX idx_ai_conversations_last_msg ON public.ai_conversations(last_message_at DESC);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own ai conversations"
  ON public.ai_conversations FOR SELECT
  USING (
    user_id = auth.uid()
    OR (is_admin(auth.uid()) AND organization_id = get_user_org_id(auth.uid()))
    OR is_super_admin(auth.uid())
  );

CREATE POLICY "Users insert own ai conversations"
  ON public.ai_conversations FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id = get_user_org_id(auth.uid())
    AND (is_admin(auth.uid()) OR is_super_admin(auth.uid()))
  );

CREATE POLICY "Users update own ai conversations"
  ON public.ai_conversations FOR UPDATE
  USING (user_id = auth.uid() OR is_super_admin(auth.uid()));

CREATE POLICY "Users delete own ai conversations"
  ON public.ai_conversations FOR DELETE
  USING (user_id = auth.uid() OR is_super_admin(auth.uid()));

CREATE TRIGGER ai_conversations_updated_at
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 3. ai_messages
-- ============================================================
CREATE TABLE public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','tool','system')),
  content text NOT NULL DEFAULT '',
  tool_calls jsonb,
  tool_results jsonb,
  status text NOT NULL DEFAULT 'ok' CHECK (status IN ('ok','aborted','failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_messages_conv ON public.ai_messages(conversation_id, created_at);

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view ai messages of accessible conversations"
  ON public.ai_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM public.ai_conversations
      WHERE user_id = auth.uid()
        OR (is_admin(auth.uid()) AND organization_id = get_user_org_id(auth.uid()))
        OR is_super_admin(auth.uid())
    )
  );

CREATE POLICY "Users insert ai messages in own conversations"
  ON public.ai_messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM public.ai_conversations
      WHERE user_id = auth.uid() OR is_super_admin(auth.uid())
    )
  );

CREATE POLICY "Users update own ai messages"
  ON public.ai_messages FOR UPDATE
  USING (
    conversation_id IN (
      SELECT id FROM public.ai_conversations
      WHERE user_id = auth.uid() OR is_super_admin(auth.uid())
    )
  );

CREATE POLICY "Users delete own ai messages"
  ON public.ai_messages FOR DELETE
  USING (
    conversation_id IN (
      SELECT id FROM public.ai_conversations
      WHERE user_id = auth.uid() OR is_super_admin(auth.uid())
    )
  );

-- ============================================================
-- 4. ai_runs (auditoria)
-- ============================================================
CREATE TABLE public.ai_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL,
  conversation_id uuid REFERENCES public.ai_conversations(id) ON DELETE SET NULL,
  message_id uuid REFERENCES public.ai_messages(id) ON DELETE SET NULL,
  user_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  provider text NOT NULL,
  model text NOT NULL,
  input_tokens int DEFAULT 0,
  output_tokens int DEFAULT 0,
  cached_tokens int DEFAULT 0,
  duration_ms int DEFAULT 0,
  status text NOT NULL DEFAULT 'ok' CHECK (status IN ('ok','error','aborted','rate_limited')),
  error_type text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_runs_user ON public.ai_runs(user_id, created_at DESC);
CREATE INDEX idx_ai_runs_org ON public.ai_runs(organization_id, created_at DESC);
CREATE INDEX idx_ai_runs_request ON public.ai_runs(request_id);

ALTER TABLE public.ai_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view ai runs of own org"
  ON public.ai_runs FOR SELECT
  USING (
    is_super_admin(auth.uid())
    OR (is_admin(auth.uid()) AND organization_id = get_user_org_id(auth.uid()))
    OR user_id = auth.uid()
  );

-- ============================================================
-- 5. ai_tool_calls (auditoria fina)
-- ============================================================
CREATE TABLE public.ai_tool_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES public.ai_runs(id) ON DELETE CASCADE,
  request_id uuid NOT NULL,
  tool_name text NOT NULL,
  params_sanitized jsonb,
  rows_returned int DEFAULT 0,
  duration_ms int DEFAULT 0,
  status text NOT NULL DEFAULT 'ok',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_tool_calls_run ON public.ai_tool_calls(run_id, created_at);
CREATE INDEX idx_ai_tool_calls_request ON public.ai_tool_calls(request_id);

ALTER TABLE public.ai_tool_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view tool calls of accessible runs"
  ON public.ai_tool_calls FOR SELECT
  USING (
    run_id IN (
      SELECT id FROM public.ai_runs
      WHERE is_super_admin(auth.uid())
        OR (is_admin(auth.uid()) AND organization_id = get_user_org_id(auth.uid()))
        OR user_id = auth.uid()
    )
  );

-- ============================================================
-- 6. ai_knowledge_chunks
-- ============================================================
CREATE TABLE public.ai_knowledge_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL CHECK (source IN ('skill','manual','glossary','aliases','faq')),
  title text,
  content text NOT NULL,
  embedding vector(1536),
  metadata jsonb DEFAULT '{}'::jsonb,
  organization_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_knowledge_source_org ON public.ai_knowledge_chunks(source, organization_id);

ALTER TABLE public.ai_knowledge_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read knowledge global or own org"
  ON public.ai_knowledge_chunks FOR SELECT
  USING (
    organization_id IS NULL
    OR organization_id = get_user_org_id(auth.uid())
    OR is_super_admin(auth.uid())
  );

CREATE POLICY "Super admin manage global knowledge"
  ON public.ai_knowledge_chunks FOR ALL
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Org admin manage own org knowledge"
  ON public.ai_knowledge_chunks FOR ALL
  USING (is_admin(auth.uid()) AND organization_id = get_user_org_id(auth.uid()))
  WITH CHECK (is_admin(auth.uid()) AND organization_id = get_user_org_id(auth.uid()));

CREATE TRIGGER ai_knowledge_chunks_updated_at
  BEFORE UPDATE ON public.ai_knowledge_chunks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 7. RPC: ai_match_knowledge
-- ============================================================
CREATE OR REPLACE FUNCTION public.ai_match_knowledge(
  _query_embedding vector(1536),
  _match_count int DEFAULT 5,
  _threshold float DEFAULT 0.7
)
RETURNS TABLE(id uuid, source text, title text, content text, similarity float)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    k.id, k.source, k.title, k.content,
    1 - (k.embedding <=> _query_embedding) AS similarity
  FROM public.ai_knowledge_chunks k
  WHERE k.embedding IS NOT NULL
    AND (k.organization_id IS NULL OR k.organization_id = get_user_org_id(auth.uid()))
    AND (1 - (k.embedding <=> _query_embedding)) >= _threshold
  ORDER BY k.embedding <=> _query_embedding
  LIMIT _match_count
$$;

-- ============================================================
-- 8. RPC: ai_get_stock_overview
-- ============================================================
CREATE OR REPLACE FUNCTION public.ai_get_stock_overview(
  _pdv_ids uuid[] DEFAULT NULL,
  _limit int DEFAULT 100
)
RETURNS TABLE(product_name text, pdv_name text, total_quantity bigint, slot_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    sr.product_name,
    p.name AS pdv_name,
    SUM(sr.quantity)::bigint AS total_quantity,
    COUNT(*)::bigint AS slot_count
  FROM public.stock_records sr
  JOIN public.pdvs p ON p.id = sr.pdv_id
  WHERE sr.is_active = true
    AND user_can_access_pdv(auth.uid(), sr.pdv_id)
    AND (_pdv_ids IS NULL OR sr.pdv_id = ANY(_pdv_ids))
  GROUP BY sr.product_name, p.name
  ORDER BY sr.product_name, p.name
  LIMIT _limit
$$;

-- ============================================================
-- 9. RPC: ai_get_stock_redistribution_suggestions
-- ============================================================
CREATE OR REPLACE FUNCTION public.ai_get_stock_redistribution_suggestions(
  _min_coverage_days int DEFAULT 7,
  _limit int DEFAULT 20
)
RETURNS TABLE(
  product_name text,
  pdv_origem text,
  stock_origem bigint,
  vendas_30d_origem bigint,
  cobertura_origem_dias numeric,
  pdv_destino text,
  stock_destino bigint,
  vendas_30d_destino bigint,
  cobertura_destino_dias numeric,
  qtd_sugerida int,
  prioridade text,
  justificativa text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org_id uuid := get_user_org_id(auth.uid());
BEGIN
  RETURN QUERY
  WITH stock_agg AS (
    SELECT sr.product_name, sr.pdv_id, p.name AS pdv_name, SUM(sr.quantity)::bigint AS qty
    FROM public.stock_records sr
    JOIN public.pdvs p ON p.id = sr.pdv_id
    WHERE sr.is_active = true
      AND p.organization_id = _org_id
      AND user_can_access_pdv(auth.uid(), sr.pdv_id)
    GROUP BY sr.product_name, sr.pdv_id, p.name
  ),
  sales_agg AS (
    SELECT s.product_name, s.pdv_id, COUNT(*)::bigint AS vendas_30d
    FROM public.sales_records s
    JOIN public.pdvs p ON p.id = s.pdv_id
    WHERE s.status = 'Concluído'
      AND s.payment_date >= now() - interval '30 days'
      AND p.organization_id = _org_id
      AND user_can_access_pdv(auth.uid(), s.pdv_id)
    GROUP BY s.product_name, s.pdv_id
  ),
  combined AS (
    SELECT
      st.product_name, st.pdv_id, st.pdv_name, st.qty AS stock_atual,
      COALESCE(sa.vendas_30d, 0) AS vendas_30d,
      GREATEST(COALESCE(sa.vendas_30d, 0)::numeric / 30.0, 0.1) AS media_dia,
      st.qty::numeric / GREATEST(COALESCE(sa.vendas_30d, 0)::numeric / 30.0, 0.1) AS cobertura
    FROM stock_agg st
    LEFT JOIN sales_agg sa ON sa.product_name = st.product_name AND sa.pdv_id = st.pdv_id
  ),
  multi_pdv AS (
    SELECT product_name FROM combined GROUP BY product_name HAVING COUNT(DISTINCT pdv_id) >= 2
  ),
  origens AS (
    SELECT c.*, CEIL(c.media_dia * _min_coverage_days)::int AS min_origem,
      GREATEST(c.stock_atual - CEIL(c.media_dia * _min_coverage_days)::bigint, 0) AS excedente
    FROM combined c
    JOIN multi_pdv m ON m.product_name = c.product_name
    WHERE c.stock_atual > CEIL(c.media_dia * _min_coverage_days)
  ),
  destinos AS (
    SELECT c.*
    FROM combined c
    JOIN multi_pdv m ON m.product_name = c.product_name
    WHERE c.cobertura < _min_coverage_days AND c.vendas_30d > 0
  ),
  sugestoes AS (
    SELECT
      o.product_name,
      o.pdv_name AS pdv_origem,
      o.stock_atual AS stock_origem,
      o.vendas_30d AS vendas_30d_origem,
      ROUND(o.cobertura::numeric, 1) AS cobertura_origem_dias,
      d.pdv_name AS pdv_destino,
      d.stock_atual AS stock_destino,
      d.vendas_30d AS vendas_30d_destino,
      ROUND(d.cobertura::numeric, 1) AS cobertura_destino_dias,
      LEAST(o.excedente::int, GREATEST(CEIL(d.media_dia * 14)::int - d.stock_atual::int, 1)) AS qtd_sugerida,
      CASE
        WHEN d.cobertura < 3 THEN 'high'
        WHEN d.cobertura < 5 THEN 'med'
        ELSE 'low'
      END AS prioridade,
      format('Destino com %s dias de cobertura e %s vendas em 30d; origem mantém %s dias após transferência.',
        ROUND(d.cobertura::numeric,1), d.vendas_30d, _min_coverage_days) AS justificativa,
      d.cobertura AS _ord_cob,
      d.vendas_30d AS _ord_vendas
    FROM origens o
    JOIN destinos d ON d.product_name = o.product_name AND d.pdv_id <> o.pdv_id
  )
  SELECT product_name, pdv_origem, stock_origem, vendas_30d_origem, cobertura_origem_dias,
         pdv_destino, stock_destino, vendas_30d_destino, cobertura_destino_dias,
         qtd_sugerida, prioridade, justificativa
  FROM sugestoes
  ORDER BY
    CASE prioridade WHEN 'high' THEN 1 WHEN 'med' THEN 2 ELSE 3 END,
    _ord_cob ASC,
    _ord_vendas DESC
  LIMIT _limit;
END;
$$;

-- ============================================================
-- 10. RPC: ai_get_sales_summary
-- ============================================================
CREATE OR REPLACE FUNCTION public.ai_get_sales_summary(
  _start timestamptz,
  _end timestamptz,
  _pdv_ids uuid[] DEFAULT NULL
)
RETURNS TABLE(faturamento numeric, deducoes numeric, sales_count bigint, ticket_medio numeric, card_revenue numeric)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(SUM(s.amount), 0) AS faturamento,
    COALESCE(SUM(COALESCE(s.refund_amount, 0)), 0) AS deducoes,
    COUNT(*)::bigint AS sales_count,
    CASE WHEN COUNT(*) > 0 THEN COALESCE(SUM(s.amount), 0) / COUNT(*) ELSE 0 END AS ticket_medio,
    COALESCE(SUM(CASE WHEN s.payment_method IN ('Cartão de Crédito','Cartão de Débito') THEN s.amount ELSE 0 END), 0) AS card_revenue
  FROM public.sales_records s
  WHERE s.status = 'Concluído'
    AND s.payment_date >= _start
    AND s.payment_date <= _end
    AND user_can_access_pdv(auth.uid(), s.pdv_id)
    AND (_pdv_ids IS NULL OR s.pdv_id = ANY(_pdv_ids))
$$;

-- ============================================================
-- 11. RPC: ai_get_top_products
-- ============================================================
CREATE OR REPLACE FUNCTION public.ai_get_top_products(
  _start timestamptz,
  _end timestamptz,
  _pdv_ids uuid[] DEFAULT NULL,
  _limit int DEFAULT 10
)
RETURNS TABLE(product_name text, sales_count bigint, revenue numeric)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.product_name,
    COUNT(*)::bigint AS sales_count,
    COALESCE(SUM(s.amount), 0) AS revenue
  FROM public.sales_records s
  WHERE s.status = 'Concluído'
    AND s.payment_date >= _start
    AND s.payment_date <= _end
    AND user_can_access_pdv(auth.uid(), s.pdv_id)
    AND (_pdv_ids IS NULL OR s.pdv_id = ANY(_pdv_ids))
  GROUP BY s.product_name
  ORDER BY sales_count DESC
  LIMIT _limit
$$;

-- ============================================================
-- 12. RPC: ai_get_low_stock_alerts
-- ============================================================
CREATE OR REPLACE FUNCTION public.ai_get_low_stock_alerts(
  _threshold int DEFAULT 2,
  _limit int DEFAULT 50
)
RETURNS TABLE(product_name text, pdv_name text, total_quantity bigint, vendas_30d bigint)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH stock_agg AS (
    SELECT sr.product_name, sr.pdv_id, p.name AS pdv_name, SUM(sr.quantity)::bigint AS qty
    FROM public.stock_records sr
    JOIN public.pdvs p ON p.id = sr.pdv_id
    WHERE sr.is_active = true
      AND user_can_access_pdv(auth.uid(), sr.pdv_id)
    GROUP BY sr.product_name, sr.pdv_id, p.name
  ),
  sales_agg AS (
    SELECT s.product_name, s.pdv_id, COUNT(*)::bigint AS vendas_30d
    FROM public.sales_records s
    WHERE s.status = 'Concluído'
      AND s.payment_date >= now() - interval '30 days'
      AND user_can_access_pdv(auth.uid(), s.pdv_id)
    GROUP BY s.product_name, s.pdv_id
  )
  SELECT st.product_name, st.pdv_name, st.qty AS total_quantity,
         COALESCE(sa.vendas_30d, 0) AS vendas_30d
  FROM stock_agg st
  LEFT JOIN sales_agg sa ON sa.product_name = st.product_name AND sa.pdv_id = st.pdv_id
  WHERE st.qty <= _threshold
    AND COALESCE(sa.vendas_30d, 0) > 0  -- exclui produtos estagnados
  ORDER BY st.qty ASC, COALESCE(sa.vendas_30d, 0) DESC
  LIMIT _limit
$$;

-- ============================================================
-- 13. RPC: ai_get_pdv_comparison
-- ============================================================
CREATE OR REPLACE FUNCTION public.ai_get_pdv_comparison(
  _start timestamptz,
  _end timestamptz
)
RETURNS TABLE(pdv_name text, sales_count bigint, revenue numeric, ticket_medio numeric)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.name AS pdv_name,
    COUNT(*)::bigint AS sales_count,
    COALESCE(SUM(s.amount), 0) AS revenue,
    CASE WHEN COUNT(*) > 0 THEN COALESCE(SUM(s.amount), 0) / COUNT(*) ELSE 0 END AS ticket_medio
  FROM public.sales_records s
  JOIN public.pdvs p ON p.id = s.pdv_id
  WHERE s.status = 'Concluído'
    AND s.payment_date >= _start
    AND s.payment_date <= _end
    AND user_can_access_pdv(auth.uid(), s.pdv_id)
  GROUP BY p.name
  ORDER BY revenue DESC
$$;

-- ============================================================
-- 14. RPC: ai_get_purchases_summary
-- ============================================================
CREATE OR REPLACE FUNCTION public.ai_get_purchases_summary(
  _start timestamptz DEFAULT NULL,
  _end timestamptz DEFAULT NULL,
  _limit int DEFAULT 50
)
RETURNS TABLE(product_name text, total_pending int, total_cost numeric)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ps.product_name,
    SUM(ps.remaining_quantity)::int AS total_pending,
    SUM(ps.remaining_quantity * ps.unit_cost)::numeric AS total_cost
  FROM public.pre_stock ps
  WHERE ps.organization_id = get_user_org_id(auth.uid())
    AND ps.status = 'pending'
    AND ps.remaining_quantity > 0
    AND (_start IS NULL OR ps.created_at >= _start)
    AND (_end IS NULL OR ps.created_at <= _end)
  GROUP BY ps.product_name
  ORDER BY total_pending DESC
  LIMIT _limit
$$;

-- ============================================================
-- 15. RPC: ai_get_financial_summary
-- ============================================================
CREATE OR REPLACE FUNCTION public.ai_get_financial_summary(
  _start timestamptz,
  _end timestamptz
)
RETURNS TABLE(faturamento numeric, deducoes numeric, despesas numeric, resultado numeric)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH org_pdvs AS (
    SELECT id FROM public.pdvs WHERE organization_id = get_user_org_id(auth.uid())
  ),
  vendas AS (
    SELECT
      COALESCE(SUM(s.amount), 0) AS faturamento,
      COALESCE(SUM(COALESCE(s.refund_amount, 0)), 0) AS deducoes
    FROM public.sales_records s
    WHERE s.status = 'Concluído'
      AND s.payment_date >= _start AND s.payment_date <= _end
      AND s.pdv_id IN (SELECT id FROM org_pdvs)
      AND user_can_access_pdv(auth.uid(), s.pdv_id)
  ),
  despesas_calc AS (
    SELECT COALESCE(SUM(fe.amount), 0) AS despesas
    FROM public.financial_entries fe
    WHERE fe.organization_id = get_user_org_id(auth.uid())
      AND fe.reference_month >= date_trunc('month', _start)::date
      AND fe.reference_month <= date_trunc('month', _end)::date
  )
  SELECT v.faturamento, v.deducoes, d.despesas,
         (v.faturamento - v.deducoes - d.despesas) AS resultado
  FROM vendas v, despesas_calc d
$$;