
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can create api keys" ON public.api_keys;
DROP POLICY IF EXISTS "Admins can delete api keys" ON public.api_keys;
DROP POLICY IF EXISTS "Admins can update api keys" ON public.api_keys;
DROP POLICY IF EXISTS "Admins can view api keys" ON public.api_keys;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Admins can view api keys"
ON public.api_keys FOR SELECT
TO authenticated
USING ((organization_id = get_user_org_id(auth.uid())) AND is_admin(auth.uid()));

CREATE POLICY "Admins can create api keys"
ON public.api_keys FOR INSERT
TO authenticated
WITH CHECK ((organization_id = get_user_org_id(auth.uid())) AND is_admin(auth.uid()));

CREATE POLICY "Admins can update api keys"
ON public.api_keys FOR UPDATE
TO authenticated
USING ((organization_id = get_user_org_id(auth.uid())) AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete api keys"
ON public.api_keys FOR DELETE
TO authenticated
USING ((organization_id = get_user_org_id(auth.uid())) AND is_admin(auth.uid()));
