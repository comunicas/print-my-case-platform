
-- Drop the restrictive INSERT policy and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Admins can create api keys" ON public.api_keys;

CREATE POLICY "Admins can create api keys"
ON public.api_keys
FOR INSERT
TO authenticated
WITH CHECK (
  ((organization_id = get_user_org_id(auth.uid())) AND is_admin(auth.uid()))
  OR is_super_admin(auth.uid())
);
