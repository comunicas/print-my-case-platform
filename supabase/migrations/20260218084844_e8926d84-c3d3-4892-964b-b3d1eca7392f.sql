
-- Trigger para limpar preferences.default_pdv quando um PDV é excluído
-- Garante integridade dos dados no banco sem depender do frontend

CREATE OR REPLACE FUNCTION public.cleanup_pdv_preferences()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  -- Limpa o default_pdv de todos os usuários que tinham este PDV como padrão
  UPDATE public.preferences
  SET default_pdv = NULL
  WHERE default_pdv = OLD.id::text;

  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_cleanup_pdv_preferences
  AFTER DELETE ON public.pdvs
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_pdv_preferences();
