-- Criar tabela user_pdvs para atribuições de PDVs a usuários
CREATE TABLE public.user_pdvs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pdv_id uuid NOT NULL REFERENCES public.pdvs(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, pdv_id)
);

-- Habilitar RLS
ALTER TABLE public.user_pdvs ENABLE ROW LEVEL SECURITY;

-- Admins podem gerenciar atribuições da sua organização
CREATE POLICY "Admins can manage user_pdvs in their org"
ON public.user_pdvs FOR ALL
USING (
  is_admin(auth.uid()) 
  AND pdv_id IN (
    SELECT id FROM public.pdvs 
    WHERE organization_id = get_user_org_id(auth.uid())
  )
)
WITH CHECK (
  is_admin(auth.uid()) 
  AND pdv_id IN (
    SELECT id FROM public.pdvs 
    WHERE organization_id = get_user_org_id(auth.uid())
  )
);

-- Usuários podem ver suas próprias atribuições
CREATE POLICY "Users can view their own pdv assignments"
ON public.user_pdvs FOR SELECT
USING (user_id = auth.uid());

-- Função para verificar se usuário pode acessar um PDV
CREATE OR REPLACE FUNCTION public.user_can_access_pdv(_user_id uuid, _pdv_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    -- Admins veem todos os PDVs da sua organização
    (is_admin(_user_id) AND _pdv_id IN (
      SELECT id FROM pdvs WHERE organization_id = get_user_org_id(_user_id)
    ))
    OR 
    -- Super admins veem tudo
    is_super_admin(_user_id)
    OR 
    -- Usuários com atribuição específica
    EXISTS (SELECT 1 FROM user_pdvs WHERE user_id = _user_id AND pdv_id = _pdv_id)
    OR 
    -- Usuários sem nenhuma atribuição veem todos da org (fallback)
    (
      NOT EXISTS (SELECT 1 FROM user_pdvs WHERE user_id = _user_id)
      AND _pdv_id IN (
        SELECT id FROM pdvs WHERE organization_id = get_user_org_id(_user_id)
      )
    )
$$;