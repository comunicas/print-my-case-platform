
-- ============================================================
-- Fase 5: Correção de 5 gaps de segurança nas políticas RLS
-- ============================================================

-- Gap 1: Corrigir bug cl.phone = cl.phone em catalog_leads
DROP POLICY IF EXISTS "Anyone can insert catalog leads with rate limit" ON public.catalog_leads;
CREATE POLICY "Anyone can insert catalog leads with rate limit"
  ON public.catalog_leads
  FOR INSERT
  WITH CHECK (
    NOT (EXISTS (
      SELECT 1
      FROM catalog_leads cl
      WHERE cl.phone = catalog_leads.phone
        AND cl.organization_id = catalog_leads.organization_id
        AND cl.created_at > (now() - interval '1 minute')
    ))
  );

-- Gap 2: Restringir audit_logs INSERT para apenas o próprio ator
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (actor_id = auth.uid());

-- Gap 3: Adicionar WITH CHECK em organizations UPDATE
DROP POLICY IF EXISTS "Org admins can update their organization" ON public.organizations;
CREATE POLICY "Org admins can update their organization"
  ON public.organizations
  FOR UPDATE
  USING ((id = get_user_org_id(auth.uid())) AND is_admin(auth.uid()))
  WITH CHECK ((id = get_user_org_id(auth.uid())) AND is_admin(auth.uid()));

-- Gap 4: Adicionar WITH CHECK em notifications UPDATE
DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;
CREATE POLICY "Users can update their notifications"
  ON public.notifications
  FOR UPDATE
  USING (
    (organization_id = get_user_org_id(auth.uid()))
    AND ((user_id IS NULL) OR (user_id = auth.uid()))
  )
  WITH CHECK (
    (organization_id = get_user_org_id(auth.uid()))
    AND ((user_id IS NULL) OR (user_id = auth.uid()))
  );

-- Gap 5: Tornar WITH CHECK explícito em products ALL
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products"
  ON public.products
  FOR ALL
  USING ((organization_id = get_user_org_id(auth.uid())) AND is_admin(auth.uid()))
  WITH CHECK ((organization_id = get_user_org_id(auth.uid())) AND is_admin(auth.uid()));
