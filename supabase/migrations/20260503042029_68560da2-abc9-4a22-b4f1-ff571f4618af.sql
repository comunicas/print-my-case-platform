-- ai_get_pre_stock_detail
CREATE OR REPLACE FUNCTION public.ai_get_pre_stock_detail(
  _status text DEFAULT NULL,
  _limit integer DEFAULT 100
)
RETURNS TABLE(
  product_name      text,
  status            text,
  total_comprado    bigint,
  total_disponivel  bigint,
  custo_unitario    numeric,
  custo_total       numeric,
  pdv_alocado       text,
  observacoes       text,
  ultima_entrada    date
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    ps.product_name,
    ps.status,
    SUM(ps.quantity)::bigint                                        AS total_comprado,
    SUM(ps.remaining_quantity)::bigint                              AS total_disponivel,
    ROUND(AVG(ps.unit_cost)::numeric, 2)                            AS custo_unitario,
    ROUND(SUM(ps.quantity * ps.unit_cost)::numeric, 2)              AS custo_total,
    STRING_AGG(DISTINCT pd.name, ', ')
      FILTER (WHERE pd.name IS NOT NULL)                            AS pdv_alocado,
    STRING_AGG(ps.notes, ' | ')
      FILTER (WHERE ps.notes IS NOT NULL AND ps.notes <> '')        AS observacoes,
    MAX(ps.created_at::date)                                        AS ultima_entrada
  FROM public.pre_stock ps
  LEFT JOIN public.pdvs pd ON pd.id = ps.allocated_pdv_id
  WHERE ps.organization_id = get_user_org_id(auth.uid())
    AND (_status IS NULL OR ps.status = _status)
  GROUP BY ps.product_name, ps.status
  ORDER BY ps.status, ps.product_name
  LIMIT _limit;
$function$;

REVOKE EXECUTE ON FUNCTION public.ai_get_pre_stock_detail(text, integer) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.ai_get_pre_stock_detail(text, integer) TO authenticated;

-- ai_get_financial_entries
CREATE OR REPLACE FUNCTION public.ai_get_financial_entries(
  _reference_month text DEFAULT NULL,
  _pdv_id          uuid DEFAULT NULL,
  _limit           integer DEFAULT 100
)
RETURNS TABLE(
  pdv_nome        text,
  categoria       text,
  mes_referencia  text,
  total           numeric,
  num_lancamentos bigint,
  descricoes      text
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    COALESCE(pd.name, 'Geral / Sem PDV')                              AS pdv_nome,
    fe.category                                                        AS categoria,
    TO_CHAR(fe.reference_month, 'YYYY-MM')                             AS mes_referencia,
    ROUND(SUM(fe.amount)::numeric, 2)                                  AS total,
    COUNT(*)::bigint                                                    AS num_lancamentos,
    STRING_AGG(fe.description, '; ' ORDER BY fe.amount DESC)
      FILTER (WHERE fe.description IS NOT NULL AND fe.description <> '') AS descricoes
  FROM public.financial_entries fe
  LEFT JOIN public.pdvs pd ON pd.id = fe.pdv_id
  WHERE fe.organization_id = get_user_org_id(auth.uid())
    AND (_pdv_id   IS NULL OR fe.pdv_id = _pdv_id)
    AND (_reference_month IS NULL
         OR TO_CHAR(fe.reference_month, 'YYYY-MM') = _reference_month)
  GROUP BY pd.name, fe.category, TO_CHAR(fe.reference_month, 'YYYY-MM')
  ORDER BY mes_referencia DESC, pd.name NULLS LAST, SUM(fe.amount) DESC
  LIMIT _limit;
$function$;

REVOKE EXECUTE ON FUNCTION public.ai_get_financial_entries(text, uuid, integer) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.ai_get_financial_entries(text, uuid, integer) TO authenticated;

-- ai_get_payment_breakdown
CREATE OR REPLACE FUNCTION public.ai_get_payment_breakdown(
  _start   timestamptz,
  _end     timestamptz,
  _pdv_ids uuid[] DEFAULT NULL
)
RETURNS TABLE(
  pdv_nome        text,
  forma_pagamento text,
  num_vendas      bigint,
  faturamento     numeric,
  pct_do_pdv      numeric
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH pdv_totais AS (
    SELECT
      sr.pdv_id,
      SUM(sr.amount)::numeric AS total_pdv
    FROM public.sales_records sr
    WHERE sr.status = 'Concluído'
      AND sr.order_time BETWEEN _start AND _end
      AND user_can_access_pdv(auth.uid(), sr.pdv_id)
      AND (_pdv_ids IS NULL OR sr.pdv_id = ANY(_pdv_ids))
    GROUP BY sr.pdv_id
  )
  SELECT
    p.name                                                              AS pdv_nome,
    COALESCE(sr.payment_method, 'Não informado')                        AS forma_pagamento,
    COUNT(*)::bigint                                                    AS num_vendas,
    ROUND(SUM(sr.amount)::numeric, 2)                                   AS faturamento,
    ROUND(100.0 * SUM(sr.amount) / NULLIF(pt.total_pdv, 0), 1)          AS pct_do_pdv
  FROM public.sales_records sr
  JOIN public.pdvs p  ON p.id  = sr.pdv_id
  JOIN pdv_totais pt  ON pt.pdv_id = sr.pdv_id
  WHERE sr.status = 'Concluído'
    AND sr.order_time BETWEEN _start AND _end
    AND user_can_access_pdv(auth.uid(), sr.pdv_id)
    AND (_pdv_ids IS NULL OR sr.pdv_id = ANY(_pdv_ids))
  GROUP BY p.name, sr.payment_method, pt.total_pdv
  ORDER BY p.name, SUM(sr.amount) DESC;
$function$;

REVOKE EXECUTE ON FUNCTION public.ai_get_payment_breakdown(timestamptz, timestamptz, uuid[]) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.ai_get_payment_breakdown(timestamptz, timestamptz, uuid[]) TO authenticated;