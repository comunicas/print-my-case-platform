-- Fix: dre_config.organization_id sem ON DELETE → bloqueava exclusão de org
-- Aplicado manualmente no Supabase em 08/05/2026. Registrado aqui para
-- manter o histórico de migrations consistente com o banco de produção.

ALTER TABLE public.dre_config
  DROP CONSTRAINT IF EXISTS dre_config_organization_id_fkey,
  ADD CONSTRAINT dre_config_organization_id_fkey
    FOREIGN KEY (organization_id)
    REFERENCES public.organizations(id)
    ON DELETE CASCADE;
