
-- =============================================
-- Fase 1: Alterar Foreign Keys bloqueantes
-- =============================================

-- profiles.organization_id → SET NULL (manter usuario auth, desvincula da org)
ALTER TABLE public.profiles
  DROP CONSTRAINT profiles_organization_id_fkey,
  ADD CONSTRAINT profiles_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
    ON DELETE SET NULL;

-- pdvs.organization_id → CASCADE (deletar PDVs quando org é removida)
ALTER TABLE public.pdvs
  DROP CONSTRAINT pdvs_organization_id_fkey,
  ADD CONSTRAINT pdvs_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
    ON DELETE CASCADE;

-- products.organization_id → CASCADE
ALTER TABLE public.products
  DROP CONSTRAINT products_organization_id_fkey,
  ADD CONSTRAINT products_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
    ON DELETE CASCADE;

-- =============================================
-- Fase 2: Corrigir RLS de PDVs (super_admin bypass)
-- =============================================

-- DELETE: adicionar bypass super_admin
DROP POLICY IF EXISTS "Admins can delete PDVs" ON public.pdvs;
CREATE POLICY "Admins can delete PDVs"
  ON public.pdvs FOR DELETE
  TO authenticated
  USING (
    ((organization_id = get_user_org_id(auth.uid())) AND is_admin(auth.uid()))
    OR is_super_admin(auth.uid())
  );

-- UPDATE: adicionar bypass super_admin
DROP POLICY IF EXISTS "Admins can update PDVs" ON public.pdvs;
CREATE POLICY "Admins can update PDVs"
  ON public.pdvs FOR UPDATE
  TO authenticated
  USING (
    ((organization_id = get_user_org_id(auth.uid())) AND is_admin(auth.uid()))
    OR is_super_admin(auth.uid())
  );

-- =============================================
-- Fase 3: Adicionar policy de DELETE em profiles
-- =============================================

CREATE POLICY "Super admins can delete profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (is_super_admin(auth.uid()));
