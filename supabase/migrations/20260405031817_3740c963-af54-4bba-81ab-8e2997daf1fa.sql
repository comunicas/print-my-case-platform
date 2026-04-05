
DROP FUNCTION IF EXISTS public.get_annual_dre_summary(uuid[], integer);

CREATE FUNCTION public.get_annual_dre_summary(p_pdv_ids uuid[], p_year integer)
RETURNS TABLE(month_start text, faturamento numeric, deducoes numeric, sales_count bigint, card_revenue numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    to_char(date_trunc('month', payment_date), 'YYYY-MM-DD') AS month_start,
    COALESCE(SUM(amount), 0) AS faturamento,
    COALESCE(SUM(refund_amount), 0) AS deducoes,
    COUNT(*) AS sales_count,
    COALESCE(SUM(CASE WHEN payment_method IN ('creditCard','debitCard','credit_card','debit_card','Cartão de Crédito','Cartão de Débito') THEN amount ELSE 0 END), 0) AS card_revenue
  FROM sales_records
  WHERE pdv_id = ANY(p_pdv_ids)
    AND EXTRACT(YEAR FROM payment_date) = p_year
    AND status IN ('Completed', 'Pago', 'Concluído')
  GROUP BY date_trunc('month', payment_date)
  ORDER BY date_trunc('month', payment_date)
$$;
