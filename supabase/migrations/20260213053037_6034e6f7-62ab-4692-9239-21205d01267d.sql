
-- Create catalog_leads table for WhatsApp lead capture
CREATE TABLE public.catalog_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  pdv_id uuid REFERENCES public.pdvs(id) ON DELETE SET NULL,
  phone text NOT NULL,
  product_name text NOT NULL,
  catalog_slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.catalog_leads ENABLE ROW LEVEL SECURITY;

-- Anyone can insert leads (public catalog page)
CREATE POLICY "Anyone can insert catalog leads"
ON public.catalog_leads
FOR INSERT
WITH CHECK (true);

-- Admins can view leads for their organization
CREATE POLICY "Admins can view catalog leads"
ON public.catalog_leads
FOR SELECT
USING (
  is_admin(auth.uid()) AND organization_id = get_user_org_id(auth.uid())
);

-- Super admins can view all leads
CREATE POLICY "Super admins can view all catalog leads"
ON public.catalog_leads
FOR SELECT
USING (is_super_admin(auth.uid()));

-- Admins can delete leads
CREATE POLICY "Admins can delete catalog leads"
ON public.catalog_leads
FOR DELETE
USING (
  is_admin(auth.uid()) AND organization_id = get_user_org_id(auth.uid())
);

-- Index for querying by organization
CREATE INDEX idx_catalog_leads_org_id ON public.catalog_leads(organization_id);
CREATE INDEX idx_catalog_leads_created_at ON public.catalog_leads(created_at DESC);
