-- Add public catalog columns to organizations
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS public_slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS public_catalog_enabled BOOLEAN DEFAULT false;

-- Create product_requests table
CREATE TABLE IF NOT EXISTS public.product_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  requested_model TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can create product requests (public access)
CREATE POLICY "Anyone can create product requests"
ON public.product_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  organization_id IN (
    SELECT id FROM public.organizations 
    WHERE public_catalog_enabled = true
  )
);

-- Admins can view product requests for their organization
CREATE POLICY "Admins can view product requests"
ON public.product_requests
FOR SELECT
USING (
  is_admin(auth.uid()) AND 
  organization_id = get_user_org_id(auth.uid())
);

-- Admins can update product requests
CREATE POLICY "Admins can update product requests"
ON public.product_requests
FOR UPDATE
USING (
  is_admin(auth.uid()) AND 
  organization_id = get_user_org_id(auth.uid())
);

-- Admins can delete product requests
CREATE POLICY "Admins can delete product requests"
ON public.product_requests
FOR DELETE
USING (
  is_admin(auth.uid()) AND 
  organization_id = get_user_org_id(auth.uid())
);

-- Create function to get public organization by slug
CREATE OR REPLACE FUNCTION public.get_public_organization(p_slug TEXT)
RETURNS TABLE (id UUID, name TEXT, public_slug TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.id, o.name, o.public_slug
  FROM public.organizations o
  WHERE o.public_slug = p_slug
    AND o.public_catalog_enabled = true
$$;