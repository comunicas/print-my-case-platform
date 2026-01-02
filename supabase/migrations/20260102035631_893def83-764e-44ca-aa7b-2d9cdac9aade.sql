-- Create table for PDV-specific catalog settings
CREATE TABLE public.pdv_catalog_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pdv_id UUID REFERENCES public.pdvs(id) ON DELETE CASCADE NOT NULL UNIQUE,
  catalog_code TEXT,
  catalog_qrcode_url TEXT,
  is_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pdv_catalog_settings ENABLE ROW LEVEL SECURITY;

-- Admins can manage PDV catalog settings in their org
CREATE POLICY "Admins can manage pdv catalog settings"
ON public.pdv_catalog_settings FOR ALL
USING (
  is_admin(auth.uid()) AND 
  pdv_id IN (SELECT id FROM public.pdvs WHERE organization_id = get_user_org_id(auth.uid()))
)
WITH CHECK (
  is_admin(auth.uid()) AND 
  pdv_id IN (SELECT id FROM public.pdvs WHERE organization_id = get_user_org_id(auth.uid()))
);

-- Public can view enabled PDV catalog settings (for public catalog)
CREATE POLICY "Public can view enabled pdv catalog settings"
ON public.pdv_catalog_settings FOR SELECT
USING (is_enabled = true);

-- Trigger for updated_at
CREATE TRIGGER update_pdv_catalog_settings_updated_at
  BEFORE UPDATE ON public.pdv_catalog_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update get_public_organization to return PDV-specific catalog settings
CREATE OR REPLACE FUNCTION public.get_public_organization(p_slug text)
RETURNS TABLE(
  id uuid, 
  name text, 
  public_slug text, 
  catalog_code_enabled boolean, 
  catalog_code text, 
  catalog_pdv_id uuid, 
  catalog_qrcode_url text, 
  pdv_name text, 
  pdv_location text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    o.id, 
    o.name, 
    o.public_slug, 
    COALESCE(pcs.is_enabled, o.catalog_code_enabled) as catalog_code_enabled,
    COALESCE(pcs.catalog_code, o.catalog_code) as catalog_code,
    o.catalog_pdv_id, 
    COALESCE(pcs.catalog_qrcode_url, o.catalog_qrcode_url) as catalog_qrcode_url,
    p.name as pdv_name,
    p.location as pdv_location
  FROM public.organizations o
  LEFT JOIN public.pdvs p ON o.catalog_pdv_id = p.id
  LEFT JOIN public.pdv_catalog_settings pcs ON o.catalog_pdv_id = pcs.pdv_id AND pcs.is_enabled = true
  WHERE o.public_slug = p_slug
    AND o.public_catalog_enabled = true
$$;