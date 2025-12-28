-- Criar enum para tipos de eventos de auditoria
CREATE TYPE public.audit_event_type AS ENUM (
  'user_creation_attempt',
  'user_creation_success',
  'user_creation_failed',
  'permission_violation',
  'organization_creation',
  'role_assignment'
);

-- Criar tabela de audit logs
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type public.audit_event_type NOT NULL,
  actor_id uuid,
  actor_email text,
  actor_role text,
  target_email text,
  target_role text,
  organization_id uuid,
  organization_name text,
  success boolean NOT NULL DEFAULT false,
  error_message text,
  metadata jsonb DEFAULT '{}',
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Apenas super_admin pode ver audit logs
CREATE POLICY "Super admins can view audit logs"
ON public.audit_logs FOR SELECT
USING (is_super_admin(auth.uid()));

-- Criar índices para consultas frequentes
CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_event_type ON public.audit_logs(event_type);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_success ON public.audit_logs(success);
CREATE INDEX idx_audit_logs_organization ON public.audit_logs(organization_id);