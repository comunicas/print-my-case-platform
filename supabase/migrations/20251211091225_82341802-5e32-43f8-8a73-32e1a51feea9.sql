-- =====================================================
-- SECURITY FIX: Restrict access to sensitive data
-- profiles: users can only view their own profile, admins can view all in org
-- organizations: only admins can view organization data
-- =====================================================

-- 1. Fix profiles table RLS
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;

CREATE POLICY "Users can view profiles"
ON profiles FOR SELECT
USING (
  (id = auth.uid()) OR 
  (organization_id = get_user_org_id(auth.uid()) AND is_admin(auth.uid())) OR
  is_super_admin(auth.uid())
);

-- 2. Fix organizations table RLS
DROP POLICY IF EXISTS "Users can view organizations" ON organizations;

CREATE POLICY "Admins can view organizations"
ON organizations FOR SELECT
USING (
  (id = get_user_org_id(auth.uid()) AND is_admin(auth.uid())) OR
  is_super_admin(auth.uid())
);