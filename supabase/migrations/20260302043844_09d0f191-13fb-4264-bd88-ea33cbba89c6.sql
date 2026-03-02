
-- Remove duplicates: keep only the most recent per organization where pdv_id IS NULL
DELETE FROM public.dre_config a
USING public.dre_config b
WHERE a.organization_id = b.organization_id
  AND a.pdv_id IS NULL
  AND b.pdv_id IS NULL
  AND a.updated_at < b.updated_at;

-- Drop the old unique constraint that doesn't handle NULLs
ALTER TABLE public.dre_config DROP CONSTRAINT IF EXISTS dre_config_organization_id_pdv_id_key;

-- Partial unique index for org-level config (pdv_id IS NULL)
CREATE UNIQUE INDEX dre_config_org_null_pdv ON public.dre_config (organization_id) WHERE pdv_id IS NULL;

-- Partial unique index for pdv-specific config
CREATE UNIQUE INDEX dre_config_org_pdv ON public.dre_config (organization_id, pdv_id) WHERE pdv_id IS NOT NULL;
