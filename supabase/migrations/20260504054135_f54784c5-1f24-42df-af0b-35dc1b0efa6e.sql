-- RPC consolidada para dados dos gráficos do dashboard
-- Elimina dependência de leitura bruta de sales_records com LIMIT no client
-- Garante que cards e gráficos usem a mesma base lógica (status='Concluído', payment_date)

CREATE OR REPLACE FUNCTION public.get_dashboard_charts(
  p_start_date timestamptz,
  p_end_date   timestamptz,
  p_pdv_ids    uuid[] DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sales_by_day      jsonb;
  v_sales_by_hour_day jsonb;
  v_top_products      jsonb;
  v_losses_by_day     jsonb;
BEGIN
  -- Vendas por dia (líquidas: amount - refund_amount), só Concluído
  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.day), '[]'::jsonb)
    INTO v_sales_by_day
  FROM (
    SELECT
      DATE(payment_date AT TIME ZONE 'America/Sao_Paulo') AS day,
      SUM(amount - COALESCE(refund_amount, 0))::numeric  AS revenue,
      COUNT(*)::bigint                                    AS count
    FROM public.sales_records
    WHERE status = 'Concluído'
      AND payment_date >= p_start_date
      AND payment_date <= p_end_date
      AND user_can_access_pdv(auth.uid(), pdv_id)
      AND (p_pdv_ids IS NULL OR pdv_id = ANY(p_pdv_ids))
    GROUP BY 1
  ) t;

  -- Heatmap por hora x dia da semana (faixas de 2h calculadas no client)
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
    INTO v_sales_by_hour_day
  FROM (
    SELECT
      EXTRACT(HOUR FROM payment_date AT TIME ZONE 'America/Sao_Paulo')::int AS hour,
      EXTRACT(DOW  FROM payment_date AT TIME ZONE 'America/Sao_Paulo')::int AS day_of_week,
      SUM(amount - COALESCE(refund_amount, 0))::numeric                     AS revenue,
      COUNT(*)::bigint                                                       AS count
    FROM public.sales_records
    WHERE status = 'Concluído'
      AND payment_date >= p_start_date
      AND payment_date <= p_end_date
      AND user_can_access_pdv(auth.uid(), pdv_id)
      AND (p_pdv_ids IS NULL OR pdv_id = ANY(p_pdv_ids))
    GROUP BY 1, 2
  ) t;

  -- Top produtos por receita (top 20, client corta em 10)
  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.revenue DESC), '[]'::jsonb)
    INTO v_top_products
  FROM (
    SELECT
      product_name AS name,
      SUM(amount - COALESCE(refund_amount, 0))::numeric AS revenue,
      COUNT(*)::bigint                                   AS count
    FROM public.sales_records
    WHERE status = 'Concluído'
      AND payment_date >= p_start_date
      AND payment_date <= p_end_date
      AND user_can_access_pdv(auth.uid(), pdv_id)
      AND (p_pdv_ids IS NULL OR pdv_id = ANY(p_pdv_ids))
    GROUP BY product_name
    ORDER BY revenue DESC
    LIMIT 20
  ) t;

  -- Perdas por dia (cancelamentos + reembolsos)
  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.day), '[]'::jsonb)
    INTO v_losses_by_day
  FROM (
    SELECT
      day,
      SUM(cancellations)::numeric    AS cancellations,
      SUM(cancellation_count)::bigint AS cancellation_count,
      SUM(refunds)::numeric           AS refunds,
      SUM(refund_count)::bigint       AS refund_count
    FROM (
      SELECT
        DATE(payment_date AT TIME ZONE 'America/Sao_Paulo') AS day,
        amount AS cancellations,
        1      AS cancellation_count,
        0      AS refunds,
        0      AS refund_count
      FROM public.sales_records
      WHERE status = 'Cancelado'
        AND payment_date >= p_start_date
        AND payment_date <= p_end_date
        AND user_can_access_pdv(auth.uid(), pdv_id)
        AND (p_pdv_ids IS NULL OR pdv_id = ANY(p_pdv_ids))

      UNION ALL

      SELECT
        DATE(payment_date AT TIME ZONE 'America/Sao_Paulo') AS day,
        0,
        0,
        COALESCE(refund_amount, 0),
        CASE WHEN COALESCE(refund_amount, 0) > 0 THEN 1 ELSE 0 END
      FROM public.sales_records
      WHERE status = 'Concluído'
        AND COALESCE(refund_amount, 0) > 0
        AND payment_date >= p_start_date
        AND payment_date <= p_end_date
        AND user_can_access_pdv(auth.uid(), pdv_id)
        AND (p_pdv_ids IS NULL OR pdv_id = ANY(p_pdv_ids))
    ) u
    GROUP BY day
  ) t;

  RETURN jsonb_build_object(
    'sales_by_day',      v_sales_by_day,
    'sales_by_hour_day', v_sales_by_hour_day,
    'top_products',      v_top_products,
    'losses_by_day',     v_losses_by_day
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_dashboard_charts(timestamptz, timestamptz, uuid[]) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.get_dashboard_charts(timestamptz, timestamptz, uuid[]) TO authenticated;