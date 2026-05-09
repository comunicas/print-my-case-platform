# Corrigir upsert da `ingest-revenue` via RPC com índice parcial

## Problema
`upsert(..., { onConflict: "order_number,pdv_id" })` no supabase-js v2 não permite passar o predicado `WHERE source='api'`. O Postgres rejeita com `42P10` porque o único índice que casa com essa coluna é parcial.

## Solução: RPC `upsert_api_sales_records`
Criar função SQL `SECURITY DEFINER` que recebe um array JSONB de registros e executa um `INSERT ... ON CONFLICT (order_number, pdv_id) WHERE source='api' DO UPDATE` — atômico, server-side, mantém o índice parcial atual sem afetar `spreadsheet`/`manual`.

## Mudanças

### 1. Migration — função `public.upsert_api_sales_records`
```sql
CREATE OR REPLACE FUNCTION public.upsert_api_sales_records(_records jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected integer;
BEGIN
  -- Apenas service_role pode chamar (a Edge Function usa service role)
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
    r->>'order_number', (r->>'pdv_id')::uuid, NULLIF(r->>'upload_id','')::uuid,
    COALESCE(r->>'source','api'),
    r->>'product_name', r->>'device_id', r->>'merchant_id',
    r->>'transaction_number', r->>'payment_method', r->>'status',
    (r->>'amount')::numeric,
    NULLIF(r->>'actual_paid_amount','')::numeric,
    COALESCE(NULLIF(r->>'discount_amount','')::numeric, 0),
    COALESCE(NULLIF(r->>'refund_amount','')::numeric, 0),
    NULLIF(r->>'payment_date','')::timestamptz,
    NULLIF(r->>'order_time','')::timestamptz,
    NULLIF(r->>'order_completion_time','')::timestamptz,
    r->>'payment_flow', r->>'print_code'
  FROM jsonb_array_elements(_records) r
  ON CONFLICT (order_number, pdv_id) WHERE source='api' DO UPDATE SET
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

REVOKE ALL ON FUNCTION public.upsert_api_sales_records(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_api_sales_records(jsonb) TO service_role;
```

### 2. Edge Function `ingest-revenue`
Substituir o bloco do upsert (linhas ~459-470) por:
```ts
if (records.length > 0) {
  const chunkSize = 500;
  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);
    const { error: upErr } = await admin.rpc("upsert_api_sales_records", {
      _records: chunk,
    });
    if (upErr) throw upErr;
    inserted += chunk.length;
  }
}
```
- `admin` já usa service role, então passa o guard `auth.role()='service_role'`.
- `mapOrderToRecord` continua igual (já produz objetos compatíveis); garantir que `source: "api"` esteja incluído na saída (verificar no código atual e ajustar se necessário).

### 3. Não muda
- Índice parcial `(order_number, pdv_id) WHERE source='api'` (mantido).
- Schema de `sales_records`.
- Frontend (`ApiSyncDialog`, `Uploads.tsx`).
- Serialização de erros (já robusta).

## Validação
1. Rodar migration.
2. Disparar sync para 1 PDV em /uploads.
3. Conferir card vira "ready" e `sales_records` recebe linhas com `source='api'`.
4. Rodar 2ª vez no mesmo período: contagem não dobra (UPDATE no conflito).
5. Rodar para PDV cujo período tem `spreadsheet` no mesmo `order_number` em outro PDV: não interfere (índice parcial só compara `source='api'`).

## Arquivos tocados
- `supabase/migrations/<nova>.sql` (função RPC).
- `supabase/functions/ingest-revenue/index.ts` (troca do `.upsert()` pelo `.rpc()`).
