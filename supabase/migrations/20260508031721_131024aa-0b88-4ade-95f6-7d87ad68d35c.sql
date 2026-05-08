-- Fix: dre_config.organization_id sem ON DELETE → bloqueia exclusão de org
ALTER TABLE public.dre_config
  DROP CONSTRAINT IF EXISTS dre_config_organization_id_fkey,
  ADD CONSTRAINT dre_config_organization_id_fkey
    FOREIGN KEY (organization_id)
    REFERENCES public.organizations(id)
    ON DELETE CASCADE;
