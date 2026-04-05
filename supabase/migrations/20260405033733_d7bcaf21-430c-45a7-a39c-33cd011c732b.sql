CREATE OR REPLACE FUNCTION public.get_dre_sales_summary(
  p_pdv_ids uuid[], p_start_date timestamptz, p_end_date timestamptz
)
RETURNS TABLE(faturamento numeric, deducoes numeric, sales_count bigint, card_revenue numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    COALESCE(SUM(amount), 0),
    COALESCE(SUM(COALESCE(refund_amount, 0)), 0),
    COUNT(*),
    COALESCE(SUM(CASE WHEN payment_method IN (
      'creditCard','debitCard','credit_card','debit_card',
      'Cartão de Crédito','Cartão de Débito'
    ) THEN amount ELSE 0 END), 0)
  FROM sales_records
  WHERE pdv_id = ANY(p_pdv_ids)
    AND payment_date >= p_start_date
    AND payment_date <= p_end_date
    AND status IN ('Completed', 'Pago', 'Concluído')
$$;