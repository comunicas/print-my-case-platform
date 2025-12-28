-- 1. Adicionar policy de UPDATE em profiles para admins
CREATE POLICY "Admins can update profiles in their org"
ON profiles FOR UPDATE
USING (
  (organization_id = get_user_org_id(auth.uid()) AND is_admin(auth.uid()))
  OR
  is_super_admin(auth.uid())
)
WITH CHECK (
  (organization_id = get_user_org_id(auth.uid()) AND is_admin(auth.uid()))
  OR
  is_super_admin(auth.uid())
  OR
  (organization_id IS NULL AND is_admin(auth.uid()))
);

-- 2. Atualizar policy de SELECT em user_roles para super_admin ver todos
DROP POLICY IF EXISTS "Users can view roles in their organization" ON user_roles;

CREATE POLICY "Users can view roles"
ON user_roles FOR SELECT
USING (
  user_id IN (
    SELECT profiles.id FROM profiles 
    WHERE organization_id = get_user_org_id(auth.uid())
  )
  OR
  is_super_admin(auth.uid())
);