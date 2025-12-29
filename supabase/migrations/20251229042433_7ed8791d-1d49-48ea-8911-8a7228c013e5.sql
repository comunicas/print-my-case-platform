-- Adicionar policies para super_admin gerenciar organizações

-- Policy para super_admin criar organizações
CREATE POLICY "Super admins can create organizations"
ON public.organizations
FOR INSERT
WITH CHECK (is_super_admin(auth.uid()));

-- Policy para super_admin deletar organizações
CREATE POLICY "Super admins can delete organizations"
ON public.organizations
FOR DELETE
USING (is_super_admin(auth.uid()));