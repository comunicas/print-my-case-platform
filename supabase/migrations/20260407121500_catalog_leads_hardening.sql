-- Harden catalog_leads insertion path and abuse protections

-- 1) Keep INSERT policy constrained by minimum binding among organization_id, catalog_slug and pdv_id
DROP POLICY IF EXISTS "Anyone can insert catalog leads with rate limit" ON public.catalog_leads;
DROP POLICY IF EXISTS "Anyone can insert catalog leads" ON public.catalog_leads;

CREATE POLICY "Public insert catalog leads with binding validation"
ON public.catalog_leads
FOR INSERT
TO anon, authenticated
WITH CHECK (
  phone ~ '^\d{10,11}$'
  AND EXISTS (
    SELECT 1
    FROM public.organizations o
    LEFT JOIN public.pdvs p ON p.id = catalog_leads.pdv_id
    LEFT JOIN public.pdv_catalog_settings pcs ON pcs.pdv_id = p.id
    WHERE o.id = catalog_leads.organization_id
      AND (
        (
          catalog_leads.pdv_id IS NOT NULL
          AND p.organization_id = o.id
          AND pcs.public_slug = catalog_leads.catalog_slug
          AND pcs.is_public_enabled = true
        )
        OR (
          catalog_leads.pdv_id IS NULL
          AND o.public_slug = catalog_leads.catalog_slug
          AND o.public_catalog_enabled = true
        )
      )
  )
);

-- 2) Request context columns for anti-abuse observability and rate limiting
ALTER TABLE public.catalog_leads
  ADD COLUMN IF NOT EXISTS request_ip inet,
  ADD COLUMN IF NOT EXISTS request_fingerprint text;

CREATE INDEX IF NOT EXISTS idx_catalog_leads_request_ip_created_at
  ON public.catalog_leads(request_ip, created_at DESC)
  WHERE request_ip IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_catalog_leads_request_fingerprint_created_at
  ON public.catalog_leads(request_fingerprint, created_at DESC)
  WHERE request_fingerprint IS NOT NULL;

-- 3) Temporal deduplication helper indexes
CREATE INDEX IF NOT EXISTS idx_catalog_leads_dedup_lookup
  ON public.catalog_leads(phone, catalog_slug, product_name, created_at DESC);

-- 4) Trigger-based temporal dedup safeguard (same phone + product + slug in short window)
CREATE OR REPLACE FUNCTION public.prevent_catalog_lead_duplicates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.catalog_leads cl
    WHERE cl.phone = NEW.phone
      AND cl.catalog_slug = NEW.catalog_slug
      AND lower(cl.product_name) = lower(NEW.product_name)
      AND cl.created_at >= now() - interval '5 minutes'
  ) THEN
    RAISE EXCEPTION 'duplicate_lead_window'
      USING ERRCODE = '23505',
            HINT = 'Lead duplicado para o mesmo telefone/produto/catálogo na janela de 5 minutos.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_catalog_lead_duplicates ON public.catalog_leads;
CREATE TRIGGER trg_prevent_catalog_lead_duplicates
BEFORE INSERT ON public.catalog_leads
FOR EACH ROW
EXECUTE FUNCTION public.prevent_catalog_lead_duplicates();

-- 5) Abuse rejection metrics table
CREATE TABLE IF NOT EXISTS public.catalog_lead_abuse_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reason text NOT NULL,
  organization_id uuid,
  pdv_id uuid,
  catalog_slug text,
  phone text,
  ip_address inet,
  fingerprint text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.catalog_lead_abuse_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view catalog lead abuse events" ON public.catalog_lead_abuse_events;
CREATE POLICY "Admins can view catalog lead abuse events"
ON public.catalog_lead_abuse_events
FOR SELECT
TO authenticated
USING (
  is_super_admin(auth.uid())
  OR (
    is_admin(auth.uid())
    AND organization_id = get_user_org_id(auth.uid())
  )
);

CREATE INDEX IF NOT EXISTS idx_catalog_lead_abuse_reason_created_at
  ON public.catalog_lead_abuse_events(reason, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_catalog_lead_abuse_org_created_at
  ON public.catalog_lead_abuse_events(organization_id, created_at DESC);
