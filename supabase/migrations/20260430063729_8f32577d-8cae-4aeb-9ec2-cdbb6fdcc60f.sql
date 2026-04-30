-- ============================================================
-- AI Agent v1.1: Fix ambiguous columns + new tools for zero-stock and restock analysis
-- ============================================================

-- 1. Fix ai_get_stock_redistribution_suggestions: fully qualify all columns
CREATE OR REPLACE FUNCTION public.ai_get_stock_redistribution_suggestions(
  _min_coverage_days integer DEFAULT 7,
  _limit integer DEFAULT 20,
  _product_name text DEFAULT NULL
)
 RETURNS TABLE(
   product_name text, pdv_origem text, stock_origem bigint, vendas_30d_origem bigint,
   cobertura_origem_dias numeric, pdv_destino text, stock_destino bigint,
   vendas_30d_destino bigint, cobertura_destino_dias numeric,
   qtd_sugerida integer, prioridade text, justificativa text
 )
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _org_id uuid := get_user_org_id(auth.uid());
BEGIN
  RETURN QUERY
  WITH stock_agg AS (
    SELECT sr.product_name AS prod, sr.pdv_id AS pdv, p.name AS pdv_name, SUM(sr.quantity)::bigint AS qty
    FROM public.stock_records sr
    JOIN public.pdvs p ON p.id = sr.pdv_id
    WHERE sr.is_active = true
      AND p.organization_id = _org_id
      AND user_can_access_pdv(auth.uid(), sr.pdv_id)
      AND (_product_name IS NULL OR sr.product_name ILIKE '%' || _product_name || '%')
    GROUP BY sr.product_name, sr.pdv_id, p.name
  ),
  sales_agg AS (
    SELECT s.product_name AS prod, s.pdv_id AS pdv, COUNT(*)::bigint AS vendas_30d
    FROM public.sales_records s
    JOIN public.pdvs p ON p.id = s.pdv_id
    WHERE s.status = 'Concluído'
      AND s.payment_date >= now() - interval '30 days'
      AND p.organization_id = _org_id
      AND user_can_access_pdv(auth.uid(), s.pdv_id)
      AND (_product_name IS NULL OR s.product_name ILIKE '%' || _product_name || '%')
    GROUP BY s.product_name, s.pdv_id
  ),
  combined AS (
    SELECT
      st.prod, st.pdv, st.pdv_name, st.qty AS stock_atual,
      COALESCE(sa.vendas_30d, 0) AS vendas_30d,
      GREATEST(COALESCE(sa.vendas_30d, 0)::numeric / 30.0, 0.1) AS media_dia,
      st.qty::numeric / GREATEST(COALESCE(sa.vendas_30d, 0)::numeric / 30.0, 0.1) AS cobertura
    FROM stock_agg st
    LEFT JOIN sales_agg sa ON sa.prod = st.prod AND sa.pdv = st.pdv
  ),
  multi_pdv AS (
    SELECT c.prod FROM combined c GROUP BY c.prod HAVING COUNT(DISTINCT c.pdv) >= 2
  ),
  origens AS (
    SELECT c.prod, c.pdv, c.pdv_name, c.stock_atual, c.vendas_30d, c.media_dia, c.cobertura,
      CEIL(c.media_dia * _min_coverage_days)::int AS min_origem,
      GREATEST(c.stock_atual - CEIL(c.media_dia * _min_coverage_days)::bigint, 0) AS excedente
    FROM combined c
    JOIN multi_pdv m ON m.prod = c.prod
    WHERE c.stock_atual > CEIL(c.media_dia * _min_coverage_days)
  ),
  destinos AS (
    SELECT c.prod, c.pdv, c.pdv_name, c.stock_atual, c.vendas_30d, c.media_dia, c.cobertura
    FROM combined c
    JOIN multi_pdv m ON m.prod = c.prod
    WHERE c.cobertura < _min_coverage_days AND c.vendas_30d > 0
  ),
  sugestoes AS (
    SELECT
      o.prod AS r_product_name,
      o.pdv_name AS r_pdv_origem,
      o.stock_atual AS r_stock_origem,
      o.vendas_30d AS r_vendas_30d_origem,
      ROUND(o.cobertura::numeric, 1) AS r_cobertura_origem_dias,
      d.pdv_name AS r_pdv_destino,
      d.stock_atual AS r_stock_destino,
      d.vendas_30d AS r_vendas_30d_destino,
      ROUND(d.cobertura::numeric, 1) AS r_cobertura_destino_dias,
      LEAST(o.excedente::int, GREATEST(CEIL(d.media_dia * 14)::int - d.stock_atual::int, 1)) AS r_qtd_sugerida,
      CASE
        WHEN d.cobertura < 3 THEN 'high'
        WHEN d.cobertura < 5 THEN 'med'
        ELSE 'low'
      END AS r_prioridade,
      format('Destino com %s dias de cobertura e %s vendas em 30d; origem mantém %s dias após transferência.',
        ROUND(d.cobertura::numeric,1), d.vendas_30d, _min_coverage_days) AS r_justificativa,
      d.cobertura AS _ord_cob,
      d.vendas_30d AS _ord_vendas
    FROM origens o
    JOIN destinos d ON d.prod = o.prod AND d.pdv <> o.pdv
  )
  SELECT s.r_product_name, s.r_pdv_origem, s.r_stock_origem, s.r_vendas_30d_origem,
         s.r_cobertura_origem_dias, s.r_pdv_destino, s.r_stock_destino,
         s.r_vendas_30d_destino, s.r_cobertura_destino_dias,
         s.r_qtd_sugerida, s.r_prioridade, s.r_justificativa
  FROM sugestoes s
  ORDER BY
    CASE s.r_prioridade WHEN 'high' THEN 1 WHEN 'med' THEN 2 ELSE 3 END,
    s._ord_cob ASC,
    s._ord_vendas DESC
  LIMIT _limit;
END;
$function$;

-- 2. Add product filter to ai_get_stock_overview
CREATE OR REPLACE FUNCTION public.ai_get_stock_overview(
  _pdv_ids uuid[] DEFAULT NULL,
  _limit integer DEFAULT 100,
  _product_name text DEFAULT NULL
)
 RETURNS TABLE(product_name text, pdv_name text, total_quantity bigint, slot_count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    AND (_product_name IS NULL OR sr.product_name ILIKE '%' || _product_name || '%')
  GROUP BY sr.product_name, p.name
  ORDER BY sr.product_name, p.name
  LIMIT _limit
$function$;

-- 3. Add product filter to ai_get_purchases_summary
CREATE OR REPLACE FUNCTION public.ai_get_purchases_summary(
  _start timestamp with time zone DEFAULT NULL,
  _end timestamp with time zone DEFAULT NULL,
  _limit integer DEFAULT 50,
  _product_names text[] DEFAULT NULL
)
 RETURNS TABLE(product_name text, total_pending integer, total_cost numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    AND (_product_names IS NULL OR ps.product_name = ANY(_product_names))
  GROUP BY ps.product_name
  ORDER BY total_pending DESC
  LIMIT _limit
$function$;

-- 4. NEW: ai_get_zero_stock_items - find products zero in some/all PDVs
CREATE OR REPLACE FUNCTION public.ai_get_zero_stock_items(
  _pdv_ids uuid[] DEFAULT NULL,
  _limit integer DEFAULT 100
)
 RETURNS TABLE(
   product_name text,
   pdv_id uuid,
   pdv_name text,
   total_quantity bigint,
   slot_count bigint,
   zero_slot_count bigint,
   network_total_quantity bigint,
   stock_in_other_pdvs bigint,
   zero_scope text
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH per_pdv AS (
    SELECT
      sr.product_name,
      sr.pdv_id,
      p.name AS pdv_name,
      SUM(sr.quantity)::bigint AS total_quantity,
      COUNT(*)::bigint AS slot_count,
      COUNT(*) FILTER (WHERE sr.quantity = 0)::bigint AS zero_slot_count
    FROM public.stock_records sr
    JOIN public.pdvs p ON p.id = sr.pdv_id
    WHERE sr.is_active = true
      AND user_can_access_pdv(auth.uid(), sr.pdv_id)
      AND (_pdv_ids IS NULL OR sr.pdv_id = ANY(_pdv_ids))
    GROUP BY sr.product_name, sr.pdv_id, p.name
  ),
  network AS (
    SELECT pp.product_name, SUM(pp.total_quantity)::bigint AS network_total
    FROM per_pdv pp
    GROUP BY pp.product_name
  )
  SELECT
    pp.product_name,
    pp.pdv_id,
    pp.pdv_name,
    pp.total_quantity,
    pp.slot_count,
    pp.zero_slot_count,
    n.network_total AS network_total_quantity,
    (n.network_total - pp.total_quantity)::bigint AS stock_in_other_pdvs,
    CASE
      WHEN n.network_total = 0 THEN 'zero_in_network'
      ELSE 'zero_in_pdv_only'
    END AS zero_scope
  FROM per_pdv pp
  JOIN network n ON n.product_name = pp.product_name
  WHERE pp.total_quantity = 0
  ORDER BY pp.product_name, pp.pdv_name
  LIMIT _limit
$function$;

-- 5. NEW: ai_analyze_restock_targets - decide action per product (transfer/buy/wait)
CREATE OR REPLACE FUNCTION public.ai_analyze_restock_targets(
  _product_names text[],
  _min_coverage_days integer DEFAULT 7,
  _target_coverage_days integer DEFAULT 14
)
 RETURNS TABLE(
   product_name text,
   pdv_destino text,
   stock_destino bigint,
   vendas_30d_destino bigint,
   cobertura_destino_dias numeric,
   melhor_origem text,
   stock_origem bigint,
   excedente_origem bigint,
   qtd_transferivel integer,
   compras_pendentes integer,
   decisao text,
   justificativa text
 )
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _org_id uuid := get_user_org_id(auth.uid());
BEGIN
  RETURN QUERY
  WITH stock_agg AS (
    SELECT sr.product_name AS prod, sr.pdv_id AS pdv, p.name AS pdv_name,
           SUM(sr.quantity)::bigint AS qty
    FROM public.stock_records sr
    JOIN public.pdvs p ON p.id = sr.pdv_id
    WHERE sr.is_active = true
      AND p.organization_id = _org_id
      AND user_can_access_pdv(auth.uid(), sr.pdv_id)
      AND sr.product_name = ANY(_product_names)
    GROUP BY sr.product_name, sr.pdv_id, p.name
  ),
  sales_agg AS (
    SELECT s.product_name AS prod, s.pdv_id AS pdv, COUNT(*)::bigint AS vendas_30d
    FROM public.sales_records s
    JOIN public.pdvs p ON p.id = s.pdv_id
    WHERE s.status = 'Concluído'
      AND s.payment_date >= now() - interval '30 days'
      AND p.organization_id = _org_id
      AND user_can_access_pdv(auth.uid(), s.pdv_id)
      AND s.product_name = ANY(_product_names)
    GROUP BY s.product_name, s.pdv_id
  ),
  combined AS (
    SELECT st.prod, st.pdv, st.pdv_name, st.qty AS stock_atual,
      COALESCE(sa.vendas_30d, 0) AS vendas_30d,
      GREATEST(COALESCE(sa.vendas_30d, 0)::numeric / 30.0, 0.1) AS media_dia,
      st.qty::numeric / GREATEST(COALESCE(sa.vendas_30d, 0)::numeric / 30.0, 0.1) AS cobertura
    FROM stock_agg st
    LEFT JOIN sales_agg sa ON sa.prod = st.prod AND sa.pdv = st.pdv
  ),
  destinos AS (
    SELECT c.* FROM combined c
    WHERE c.cobertura < _min_coverage_days
  ),
  origens AS (
    SELECT c.prod, c.pdv, c.pdv_name, c.stock_atual,
      GREATEST(c.stock_atual - CEIL(c.media_dia * _min_coverage_days)::bigint, 0) AS excedente
    FROM combined c
    WHERE c.stock_atual > CEIL(c.media_dia * _min_coverage_days)
  ),
  best_origem AS (
    SELECT DISTINCT ON (d.prod, d.pdv)
      d.prod, d.pdv,
      o.pdv_name AS origem_name,
      o.stock_atual AS origem_stock,
      o.excedente AS origem_excedente
    FROM destinos d
    LEFT JOIN origens o ON o.prod = d.prod AND o.pdv <> d.pdv AND o.excedente > 0
    ORDER BY d.prod, d.pdv, o.excedente DESC NULLS LAST
  ),
  pending AS (
    SELECT ps.product_name AS prod, SUM(ps.remaining_quantity)::int AS pending_qty
    FROM public.pre_stock ps
    WHERE ps.organization_id = _org_id
      AND ps.status = 'pending'
      AND ps.remaining_quantity > 0
      AND ps.product_name = ANY(_product_names)
    GROUP BY ps.product_name
  )
  SELECT
    d.prod AS product_name,
    d.pdv_name AS pdv_destino,
    d.stock_atual AS stock_destino,
    d.vendas_30d AS vendas_30d_destino,
    ROUND(d.cobertura::numeric, 1) AS cobertura_destino_dias,
    bo.origem_name AS melhor_origem,
    COALESCE(bo.origem_stock, 0) AS stock_origem,
    COALESCE(bo.origem_excedente, 0)::bigint AS excedente_origem,
    LEAST(
      COALESCE(bo.origem_excedente, 0)::int,
      GREATEST(CEIL(d.media_dia * _target_coverage_days)::int - d.stock_atual::int, 1)
    ) AS qtd_transferivel,
    COALESCE(p.pending_qty, 0) AS compras_pendentes,
    CASE
      WHEN d.vendas_30d = 0 AND d.stock_atual = 0 THEN 'sem_dados_suficientes'
      WHEN COALESCE(bo.origem_excedente, 0) > 0 THEN 'transferir'
      WHEN COALESCE(p.pending_qty, 0) > 0 THEN 'aguardar_compra'
      WHEN d.vendas_30d > 0 THEN 'comprar'
      ELSE 'sem_acao_segura'
    END AS decisao,
    CASE
      WHEN d.vendas_30d = 0 AND d.stock_atual = 0 THEN 'Sem vendas e sem estoque; verificar se produto deve ser descontinuado.'
      WHEN COALESCE(bo.origem_excedente, 0) > 0 THEN
        format('Origem %s tem %s unidades de excedente; destino com %s dias de cobertura.',
          bo.origem_name, bo.origem_excedente, ROUND(d.cobertura::numeric,1))
      WHEN COALESCE(p.pending_qty, 0) > 0 THEN
        format('Sem origem com excedente; %s unidades em compras pendentes.', p.pending_qty)
      WHEN d.vendas_30d > 0 THEN
        format('Sem origem disponível e sem compras pendentes; demanda de %s vendas/30d justifica nova compra.', d.vendas_30d)
      ELSE 'Sem origem segura e sem demanda comprovada.'
    END AS justificativa
  FROM destinos d
  LEFT JOIN best_origem bo ON bo.prod = d.prod AND bo.pdv = d.pdv
  LEFT JOIN pending p ON p.prod = d.prod
  ORDER BY d.cobertura ASC, d.vendas_30d DESC;
END;
$function$;