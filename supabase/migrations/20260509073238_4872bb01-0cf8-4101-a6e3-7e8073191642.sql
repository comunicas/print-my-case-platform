CREATE OR REPLACE FUNCTION public.upsert_api_sales_records(_records jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected integer;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  INSERT INTO public.sales_records (
    order_number, pdv_id, upload_id, source,
    product_name, device_id, merchant_id,
    transaction_number, payment_method, status,
    amount, actual_paid_amount, discount_amount, refund_amount,
    payment_date, order_time, order_completion_time,
    payment_flow, print_code
  )
  SELECT
    r->>'order_number',
    (r->>'pdv_id')::uuid,
    NULLIF(r->>'upload_id','')::uuid,
    COALESCE(r->>'source','api'),
    r->>'product_name',
    r->>'device_id',
    r->>'merchant_id',
    r->>'transaction_number',
    r->>'payment_method',
    r->>'status',
    (r->>'amount')::numeric,
    NULLIF(r->>'actual_paid_amount','')::numeric,
    COALESCE(NULLIF(r->>'discount_amount','')::numeric, 0),
    COALESCE(NULLIF(r->>'refund_amount','')::numeric, 0),
    NULLIF(r->>'payment_date','')::timestamptz,
    NULLIF(r->>'order_time','')::timestamptz,
    NULLIF(r->>'order_completion_time','')::timestamptz,
    r->>'payment_flow',
    r->>'print_code'
  FROM jsonb_array_elements(_records) r
  ON CONFLICT (order_number, pdv_id) WHERE source = 'api' DO UPDATE SET
    upload_id = EXCLUDED.upload_id,
    product_name = EXCLUDED.product_name,
    device_id = EXCLUDED.device_id,
    merchant_id = EXCLUDED.merchant_id,
    transaction_number = EXCLUDED.transaction_number,
    payment_method = EXCLUDED.payment_method,
    status = EXCLUDED.status,
    amount = EXCLUDED.amount,
    actual_paid_amount = EXCLUDED.actual_paid_amount,
    discount_amount = EXCLUDED.discount_amount,
    refund_amount = EXCLUDED.refund_amount,
    payment_date = EXCLUDED.payment_date,
    order_time = EXCLUDED.order_time,
    order_completion_time = EXCLUDED.order_completion_time,
    payment_flow = EXCLUDED.payment_flow,
    print_code = EXCLUDED.print_code;

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_api_sales_records(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.upsert_api_sales_records(jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.upsert_api_sales_records(jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_api_sales_records(jsonb) TO service_role;