-- Política: Usuários podem ver sua própria organização
CREATE POLICY "Users can view their own organization"
  ON public.organizations
  FOR SELECT
  USING (id = get_user_org_id(auth.uid()));