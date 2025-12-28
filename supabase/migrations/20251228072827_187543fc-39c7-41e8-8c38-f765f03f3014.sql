-- 1. Criar função SECURITY DEFINER para buscar user_ids da organização
CREATE OR REPLACE FUNCTION get_org_user_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id 
  FROM profiles p
  WHERE p.organization_id = (
    SELECT organization_id FROM profiles WHERE id = _user_id
  )
$$;

-- 2. Atualizar policy de SELECT em user_roles usando a nova função
DROP POLICY IF EXISTS "Users can view roles" ON user_roles;

CREATE POLICY "Users can view roles"
ON user_roles FOR SELECT
USING (
  user_id IN (SELECT get_org_user_ids(auth.uid()))
  OR
  is_super_admin(auth.uid())
);