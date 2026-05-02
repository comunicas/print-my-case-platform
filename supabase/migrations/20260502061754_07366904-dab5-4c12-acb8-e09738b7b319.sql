CREATE TABLE public.ai_message_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.ai_messages(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating smallint NOT NULL CHECK (rating IN (1, -1)),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX ai_message_feedback_unique_user_msg
  ON public.ai_message_feedback (message_id, user_id);

CREATE INDEX ai_message_feedback_conversation_idx
  ON public.ai_message_feedback (conversation_id);

ALTER TABLE public.ai_message_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback"
  ON public.ai_message_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own feedback"
  ON public.ai_message_feedback
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins and super admins can view org feedback"
  ON public.ai_message_feedback
  FOR SELECT
  TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR conversation_id IN (
      SELECT id FROM public.ai_conversations
      WHERE is_admin(auth.uid())
        AND organization_id = get_user_org_id(auth.uid())
    )
  );