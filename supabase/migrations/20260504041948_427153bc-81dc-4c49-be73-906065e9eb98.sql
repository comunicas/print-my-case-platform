CREATE OR REPLACE FUNCTION public.ai_get_financial_summary_by_pdv(
  _start timestamptz,
  _end   timestamptz
)
RETURNS TABLE(
  pdv_nome    text,
  faturamento numeric,
  deducoes    numeric,
  despesas    numeric,
  resultado   numeric,
  margem_pct  numeric
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH vendas AS (
    SELECT
      sr.pdv_id,
      ROUND(SUM(CASE WHEN sr.status = 'Concluído' THEN sr.amount ELSE 0 END)::numeric, 2) AS fat,
      ROUND(SUM(COALESCE(sr.refund_amount, 0) + COALESCE(sr.discount_amount, 0))::numeric, 2) AS ded
    FROM public.sales_records sr
    WHERE sr.payment_date BETWEEN _start AND _end
      AND user_can_access_pdv(auth.uid(), sr.pdv_id)
    GROUP BY sr.pdv_id
  ),
  despesas AS (
    SELECT
      fe.pdv_id,
      ROUND(SUM(fe.amount)::numeric, 2) AS total_desp
    FROM public.financial_entries fe
    WHERE fe.organization_id = get_user_org_id(auth.uid())
      AND fe.reference_month BETWEEN _start::date AND _end::date
    GROUP BY fe.pdv_id
  )
  SELECT
    p.name                                               AS pdv_nome,
    COALESCE(v.fat,  0)                                  AS faturamento,
    COALESCE(v.ded,  0)                                  AS deducoes,
    COALESCE(d.total_desp, 0)                            AS despesas,
    ROUND(COALESCE(v.fat, 0)
          - COALESCE(v.ded, 0)
          - COALESCE(d.total_desp, 0), 2)                AS resultado,
    CASE
      WHEN COALESCE(v.fat, 0) = 0 THEN 0
      ELSE ROUND(
        100.0 * (COALESCE(v.fat, 0) - COALESCE(v.ded, 0) - COALESCE(d.total_desp, 0))
        / COALESCE(v.fat, 0), 1)
    END                                                  AS margem_pct
  FROM public.pdvs p
  LEFT JOIN vendas  v ON v.pdv_id = p.id
  LEFT JOIN despesas d ON d.pdv_id = p.id
  WHERE user_can_access_pdv(auth.uid(), p.id)
    AND (v.fat IS NOT NULL OR d.total_desp IS NOT NULL)
  ORDER BY resultado DESC;
$function$;

REVOKE EXECUTE ON FUNCTION public.ai_get_financial_summary_by_pdv(timestamptz, timestamptz) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.ai_get_financial_summary_by_pdv(timestamptz, timestamptz) TO authenticated;