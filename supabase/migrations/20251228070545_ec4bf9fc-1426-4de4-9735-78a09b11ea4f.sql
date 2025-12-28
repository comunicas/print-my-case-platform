-- Função para verificar se um usuário pode atribuir determinado role
CREATE OR REPLACE FUNCTION public.can_assign_role(_assigner_id uuid, _new_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE 
    -- Apenas super_admin pode atribuir super_admin
    WHEN _new_role = 'super_admin' THEN is_super_admin(_assigner_id)
    -- Apenas super_admin pode atribuir org_admin
    WHEN _new_role = 'org_admin' THEN is_super_admin(_assigner_id)
    -- Admins (org_admin e super_admin) podem atribuir operator e viewer
    ELSE is_admin(_assigner_id)
  END
$$;

-- Deletar policies antigas
DROP POLICY IF EXISTS "Admins can insert roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON user_roles;

-- Criar policies com verificação hierárquica
CREATE POLICY "Admins can insert roles with hierarchy"
ON user_roles FOR INSERT
WITH CHECK (
  is_admin(auth.uid()) 
  AND can_assign_role(auth.uid(), role)
);

CREATE POLICY "Admins can update roles with hierarchy"
ON user_roles FOR UPDATE
USING (is_admin(auth.uid()))
WITH CHECK (can_assign_role(auth.uid(), role));

CREATE POLICY "Admins can delete roles with hierarchy"
ON user_roles FOR DELETE
USING (
  is_admin(auth.uid())
  -- org_admin não pode deletar super_admin
  AND (
    is_super_admin(auth.uid()) 
    OR NOT EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = user_roles.user_id AND ur.role = 'super_admin'
    )
  )
);