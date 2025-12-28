-- 1. Criar função SECURITY DEFINER para verificar se um usuário alvo é super_admin
CREATE OR REPLACE FUNCTION target_user_is_super_admin(_target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _target_user_id AND role = 'super_admin'
  )
$$;

-- 2. Atualizar policy de DELETE em user_roles usando a nova função
DROP POLICY IF EXISTS "Admins can delete roles with hierarchy" ON user_roles;

CREATE POLICY "Admins can delete roles with hierarchy"
ON user_roles FOR DELETE
USING (
  is_admin(auth.uid()) AND (
    is_super_admin(auth.uid()) OR 
    NOT target_user_is_super_admin(user_id)
  )
);