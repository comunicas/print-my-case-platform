ALTER TABLE public.ai_messages
  ADD COLUMN IF NOT EXISTS tool_call_id text;