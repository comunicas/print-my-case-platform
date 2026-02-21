
-- 1. Create cross-org access table
CREATE TABLE public.user_org_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  access_level TEXT NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id),
  CONSTRAINT valid_access_level CHECK (access_level IN ('viewer', 'editor'))
);

ALTER TABLE public.user_org_access ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view their own access grants
CREATE POLICY "Users can view own org access"
ON public.user_org_access
FOR SELECT
USING (user_id = auth.uid());

-- RLS: Super admins can manage all
CREATE POLICY "Super admins manage org access"
ON public.user_org_access
FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- RLS: Org admins can manage access to their org
CREATE POLICY "Org admins manage access to their org"
ON public.user_org_access
FOR ALL
USING (is_admin(auth.uid()) AND organization_id = get_user_org_id(auth.uid()))
WITH CHECK (is_admin(auth.uid()) AND organization_id = get_user_org_id(auth.uid()));

-- 2. Function to check cross-org access
CREATE OR REPLACE FUNCTION public.user_has_org_access(_user_id UUID, _org_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    get_user_org_id(_user_id) = _org_id
    OR is_super_admin(_user_id)
    OR EXISTS (
      SELECT 1 FROM user_org_access
      WHERE user_id = _user_id AND organization_id = _org_id
    )
$$;

-- 3. Update user_can_access_pdv to include cross-org access
CREATE OR REPLACE FUNCTION public.user_can_access_pdv(_user_id uuid, _pdv_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    (is_admin(_user_id) AND _pdv_id IN (
      SELECT id FROM pdvs WHERE organization_id = get_user_org_id(_user_id)
    ))
    OR is_super_admin(_user_id)
    OR EXISTS (SELECT 1 FROM user_pdvs WHERE user_id = _user_id AND pdv_id = _pdv_id)
    OR (
      NOT EXISTS (SELECT 1 FROM user_pdvs WHERE user_id = _user_id)
      AND _pdv_id IN (
        SELECT id FROM pdvs WHERE organization_id = get_user_org_id(_user_id)
      )
    )
    OR EXISTS (
      SELECT 1 FROM user_org_access uoa
      JOIN pdvs p ON p.organization_id = uoa.organization_id
      WHERE uoa.user_id = _user_id AND p.id = _pdv_id
    )
$$;

-- 4. Update PDVs SELECT policy
DROP POLICY IF EXISTS "Users can view PDVs" ON public.pdvs;
CREATE POLICY "Users can view PDVs"
ON public.pdvs
FOR SELECT
USING (
  organization_id = get_user_org_id(auth.uid())
  OR is_super_admin(auth.uid())
  OR user_has_org_access(auth.uid(), organization_id)
);

-- 5. Update stock_history SELECT policy
DROP POLICY IF EXISTS "Users can view stock history of their organization" ON public.stock_history;
CREATE POLICY "Users can view stock history of their organization"
ON public.stock_history
FOR SELECT
USING (
  organization_id = get_user_org_id(auth.uid())
  OR is_super_admin(auth.uid())
  OR user_has_org_access(auth.uid(), organization_id)
);

-- 6. Update organizations SELECT to allow cross-org view
DROP POLICY IF EXISTS "Users can view their own organization" ON public.organizations;
CREATE POLICY "Users can view accessible organizations"
ON public.organizations
FOR SELECT
USING (
  id = get_user_org_id(auth.uid())
  OR user_has_org_access(auth.uid(), id)
);

-- 7. Update notifications SELECT to include cross-org (read-only, org-wide only)
DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;
CREATE POLICY "Users can view their notifications"
ON public.notifications
FOR SELECT
USING (
  (organization_id = get_user_org_id(auth.uid()) AND (user_id IS NULL OR user_id = auth.uid()))
  OR (user_has_org_access(auth.uid(), organization_id) AND user_id IS NULL)
);

-- 8. Update products SELECT policy
DROP POLICY IF EXISTS "Users can view products in their organization" ON public.products;
CREATE POLICY "Users can view products in their organization"
ON public.products
FOR SELECT
USING (
  organization_id = get_user_org_id(auth.uid())
  OR user_has_org_access(auth.uid(), organization_id)
);
