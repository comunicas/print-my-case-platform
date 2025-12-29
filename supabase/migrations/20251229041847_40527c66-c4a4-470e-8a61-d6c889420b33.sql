-- Trigger para impedir remoção de organization_id de usuários existentes
CREATE OR REPLACE FUNCTION public.prevent_orphan_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Se o usuário já tinha uma organização e está tentando remover
  IF OLD.organization_id IS NOT NULL AND NEW.organization_id IS NULL THEN
    RAISE EXCEPTION 'Não é permitido remover a organização de um usuário';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_prevent_orphan_profile
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_orphan_profile();

-- Trigger para registrar auditoria quando usuário é criado sem organização
CREATE OR REPLACE FUNCTION public.audit_orphan_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Se o profile foi criado sem organization_id, registrar alerta
  IF NEW.organization_id IS NULL THEN
    INSERT INTO public.audit_logs (
      event_type,
      target_email,
      success,
      error_message,
      metadata
    ) VALUES (
      'user_creation_failed',
      NEW.email,
      false,
      'Usuário criado sem organização - requer correção manual',
      jsonb_build_object('user_id', NEW.id, 'warning', 'orphan_user_created')
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_audit_orphan_user
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_orphan_user();