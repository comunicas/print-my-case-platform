-- Harden audit log writes: deny direct INSERT from authenticated clients
-- and expose a controlled SECURITY DEFINER RPC for app-level audit events.

DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;

REVOKE INSERT ON TABLE public.audit_logs FROM authenticated;
REVOKE INSERT ON TABLE public.audit_logs FROM anon;

CREATE OR REPLACE FUNCTION public.insert_audit_log(
  p_event_type public.audit_event_type,
  p_actor_id uuid DEFAULT NULL,
  p_organization_id uuid DEFAULT NULL,
  p_success boolean DEFAULT false,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_actor_id uuid;
  v_caller_id uuid;
  v_id uuid;
BEGIN
  IF p_event_type IS NULL THEN
    RAISE EXCEPTION 'event_type is required';
  END IF;

  IF p_success IS NULL THEN
    RAISE EXCEPTION 'success is required';
  END IF;

  IF p_metadata IS NULL OR jsonb_typeof(p_metadata) <> 'object' THEN
    RAISE EXCEPTION 'metadata must be a JSON object';
  END IF;

  v_caller_id := auth.uid();
  v_actor_id := COALESCE(p_actor_id, v_caller_id);

  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'actor_id is required';
  END IF;

  IF p_actor_id IS NOT NULL
     AND v_caller_id IS NOT NULL
     AND p_actor_id <> v_caller_id
     AND NOT is_super_admin(v_caller_id) THEN
    RAISE EXCEPTION 'actor_id must match authenticated user';
  END IF;

  IF p_organization_id IS NOT NULL
     AND v_caller_id IS NOT NULL
     AND p_organization_id <> get_user_org_id(v_caller_id)
     AND NOT is_super_admin(v_caller_id) THEN
    RAISE EXCEPTION 'organization_id is outside caller organization scope';
  END IF;

  INSERT INTO public.audit_logs (
    event_type,
    actor_id,
    organization_id,
    success,
    metadata
  ) VALUES (
    p_event_type,
    v_actor_id,
    p_organization_id,
    p_success,
    p_metadata
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.insert_audit_log(public.audit_event_type, uuid, uuid, boolean, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.insert_audit_log(public.audit_event_type, uuid, uuid, boolean, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_audit_log(public.audit_event_type, uuid, uuid, boolean, jsonb) TO service_role;

-- SQL policy test: authenticated users must not be able to INSERT directly into audit_logs.
DO $$
DECLARE
  v_denied boolean := false;
BEGIN
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', gen_random_uuid()::text, true);

  EXECUTE 'SET LOCAL ROLE authenticated';

  BEGIN
    INSERT INTO public.audit_logs (
      event_type,
      actor_id,
      success,
      metadata
    ) VALUES (
      'user_creation_attempt',
      auth.uid(),
      true,
      '{}'::jsonb
    );
  EXCEPTION
    WHEN insufficient_privilege THEN
      v_denied := true;
    WHEN OTHERS THEN
      IF POSITION('row-level security' IN LOWER(SQLERRM)) > 0 THEN
        v_denied := true;
      ELSE
        RAISE;
      END IF;
  END;

  IF NOT v_denied THEN
    RAISE EXCEPTION 'RLS regression: authenticated user INSERT into public.audit_logs was allowed';
  END IF;
END;
$$;
