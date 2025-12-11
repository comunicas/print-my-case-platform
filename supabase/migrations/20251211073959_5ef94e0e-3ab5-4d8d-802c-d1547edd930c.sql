-- Add owner_id to organizations table
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- Create is_super_admin function
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;

-- Update organizations SELECT policy
DROP POLICY IF EXISTS "Users can view their organization" ON public.organizations;
CREATE POLICY "Users can view organizations"
ON public.organizations FOR SELECT
USING (
  id = get_user_org_id(auth.uid()) 
  OR is_super_admin(auth.uid())
);

-- Update PDVs SELECT policy
DROP POLICY IF EXISTS "Users can view PDVs in their organization" ON public.pdvs;
CREATE POLICY "Users can view PDVs"
ON public.pdvs FOR SELECT
USING (
  organization_id = get_user_org_id(auth.uid())
  OR is_super_admin(auth.uid())
);

-- Update profiles SELECT policy
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.profiles;
CREATE POLICY "Users can view profiles"
ON public.profiles FOR SELECT
USING (
  organization_id = get_user_org_id(auth.uid())
  OR id = auth.uid()
  OR is_super_admin(auth.uid())
);

-- Update sales_records SELECT policy
DROP POLICY IF EXISTS "Users can view sales in their organization" ON public.sales_records;
CREATE POLICY "Users can view sales"
ON public.sales_records FOR SELECT
USING (
  pdv_id IN (SELECT id FROM pdvs WHERE organization_id = get_user_org_id(auth.uid()))
  OR is_super_admin(auth.uid())
);

-- Update stock_records SELECT policy
DROP POLICY IF EXISTS "Users can view stock in their organization" ON public.stock_records;
CREATE POLICY "Users can view stock"
ON public.stock_records FOR SELECT
USING (
  pdv_id IN (SELECT id FROM pdvs WHERE organization_id = get_user_org_id(auth.uid()))
  OR is_super_admin(auth.uid())
);

-- Update uploads SELECT policy
DROP POLICY IF EXISTS "Users can view uploads in their organization" ON public.uploads;
CREATE POLICY "Users can view uploads"
ON public.uploads FOR SELECT
USING (
  pdv_id IN (SELECT id FROM pdvs WHERE organization_id = get_user_org_id(auth.uid()))
  OR is_super_admin(auth.uid())
);