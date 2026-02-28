
-- SELECT
DROP POLICY "Admins can view api keys" ON api_keys;
CREATE POLICY "Admins can view api keys" ON api_keys FOR SELECT
  USING (
    (organization_id = get_user_org_id(auth.uid()) AND is_admin(auth.uid()))
    OR is_super_admin(auth.uid())
  );

-- INSERT
DROP POLICY "Admins can create api keys" ON api_keys;
CREATE POLICY "Admins can create api keys" ON api_keys FOR INSERT
  WITH CHECK (
    (organization_id = get_user_org_id(auth.uid()) AND is_admin(auth.uid()))
    OR is_super_admin(auth.uid())
  );

-- UPDATE
DROP POLICY "Admins can update api keys" ON api_keys;
CREATE POLICY "Admins can update api keys" ON api_keys FOR UPDATE
  USING (
    (organization_id = get_user_org_id(auth.uid()) AND is_admin(auth.uid()))
    OR is_super_admin(auth.uid())
  );

-- DELETE
DROP POLICY "Admins can delete api keys" ON api_keys;
CREATE POLICY "Admins can delete api keys" ON api_keys FOR DELETE
  USING (
    (organization_id = get_user_org_id(auth.uid()) AND is_admin(auth.uid()))
    OR is_super_admin(auth.uid())
  );
