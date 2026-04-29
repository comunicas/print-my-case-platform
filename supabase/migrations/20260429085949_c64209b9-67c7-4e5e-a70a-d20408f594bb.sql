CREATE OR REPLACE FUNCTION public.get_super_admin_global_metrics(
  p_start_date timestamptz,
  p_end_date timestamptz
)
RETURNS TABLE (
  total_organizations bigint,
  total_pdvs_global bigint,
  total_revenue_global numeric,
  total_transactions_global bigint,
  total_refunds_global numeric,
  avg_ticket_global numeric
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_revenue numeric := 0;
  v_total_refunds numeric := 0;
  v_total_tx bigint := 0;
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: super_admin required';
  END IF;

  SELECT
    COALESCE(SUM(amount), 0),
    COALESCE(SUM(COALESCE(refund_amount, 0)), 0),
    COUNT(*)
  INTO v_total_revenue, v_total_refunds, v_total_tx
  FROM public.sales_records
  WHERE payment_date >= p_start_date
    AND payment_date <= p_end_date
    AND status = 'Concluído';

  RETURN QUERY SELECT
    (SELECT COUNT(*) FROM public.organizations)::bigint,
    (SELECT COUNT(*) FROM public.pdvs WHERE status = 'active')::bigint,
    v_total_revenue,
    v_total_tx,
    v_total_refunds,
    (CASE WHEN v_total_tx > 0 THEN v_total_revenue / v_total_tx ELSE 0 END)::numeric;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_super_admin_global_metrics(timestamptz, timestamptz) TO authenticated;