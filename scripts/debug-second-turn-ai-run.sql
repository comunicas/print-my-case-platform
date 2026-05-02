-- Diagnóstico do 2º turno de uma conversation_id em caso de erro.
-- Uso (psql):
--   \set conversation_id '00000000-0000-0000-0000-000000000000'
--   \set error_ts '2026-05-02T12:34:56Z'
--   \i scripts/debug-second-turn-ai-run.sql

WITH second_turn_message AS (
  SELECT m.id, m.conversation_id, m.created_at
  FROM public.ai_messages m
  WHERE m.conversation_id = :'conversation_id'::uuid
    AND m.role = 'user'
  ORDER BY m.created_at ASC
  OFFSET 1
  LIMIT 1
),
error_run AS (
  SELECT r.*
  FROM public.ai_runs r
  JOIN second_turn_message stm ON stm.id = r.message_id
  WHERE r.status IN ('error', 'rate_limited', 'aborted')
  ORDER BY ABS(EXTRACT(EPOCH FROM (r.created_at - :'error_ts'::timestamptz))) ASC
  LIMIT 1
),
run_tool_calls AS (
  SELECT tc.*
  FROM public.ai_tool_calls tc
  JOIN error_run er ON er.id = tc.run_id
)
SELECT 'run' AS section,
       er.id AS run_id,
       er.status,
       er.error_type,
       er.error_message,
       er.provider,
       er.model,
       er.created_at
FROM error_run er

UNION ALL

SELECT 'tool_summary' AS section,
       er.id AS run_id,
       CASE
         WHEN EXISTS (SELECT 1 FROM run_tool_calls rtc WHERE rtc.tool_name = 'analyze_restock_targets')
           THEN 'analyze_restock_targets_called'
         ELSE 'analyze_restock_targets_not_called'
       END AS status,
       NULL::text AS error_type,
       NULL::text AS error_message,
       NULL::text AS provider,
       NULL::text AS model,
       NULL::timestamptz AS created_at
FROM error_run er
;

-- Detalhes das tool calls do run (inclui sinais de RPC/tool_failed e product_names).
SELECT
  tc.id,
  tc.run_id,
  tc.tool_name,
  tc.status,
  tc.error,
  tc.created_at,
  tc.params_sanitized,
  CASE
    WHEN tc.params_sanitized ? 'product_names' THEN
      jsonb_array_length(COALESCE(tc.params_sanitized->'product_names', '[]'::jsonb))
    ELSE NULL
  END AS product_names_count,
  CASE
    WHEN tc.params_sanitized ? 'product_names' THEN tc.params_sanitized->'product_names'
    ELSE NULL
  END AS product_names,
  CASE
    WHEN tc.status = 'tool_failed'
      AND (
        COALESCE(tc.error, '') ILIKE '%rpc%'
        OR COALESCE(tc.error, '') ILIKE '%function%'
        OR COALESCE(tc.error, '') ILIKE '%postgres%'
      )
    THEN true ELSE false
  END AS rpc_failure_signal,
  CASE
    WHEN tc.params_sanitized ? 'product_names'
      AND jsonb_typeof(tc.params_sanitized->'product_names') = 'array'
      AND jsonb_array_length(tc.params_sanitized->'product_names') = 0
    THEN true ELSE false
  END AS empty_product_names_signal
FROM run_tool_calls tc
ORDER BY tc.created_at ASC;

-- Se não houver tool calls, revisar sinais de erro de provider/quota/rate limit no próprio run.
SELECT
  er.id AS run_id,
  er.status,
  er.error_type,
  er.error_message,
  (COALESCE(er.error_type, '') ILIKE '%rate%'
    OR COALESCE(er.error_message, '') ILIKE '%rate limit%') AS rate_limit_signal,
  (COALESCE(er.error_type, '') ILIKE '%quota%'
    OR COALESCE(er.error_message, '') ILIKE '%quota%') AS quota_signal,
  (COALESCE(er.error_type, '') ILIKE '%provider%'
    OR COALESCE(er.error_message, '') ILIKE '%openai%') AS provider_signal
FROM error_run er
WHERE NOT EXISTS (SELECT 1 FROM run_tool_calls);
