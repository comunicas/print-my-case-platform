-- Allow super_admin to create PDVs for any organization
DROP POLICY IF EXISTS "Admins can create PDVs" ON pdvs;
CREATE POLICY "Admins can create PDVs" ON pdvs
FOR INSERT TO authenticated
WITH CHECK (
  ((organization_id = get_user_org_id(auth.uid())) AND is_admin(auth.uid()))
  OR is_super_admin(auth.uid())
);