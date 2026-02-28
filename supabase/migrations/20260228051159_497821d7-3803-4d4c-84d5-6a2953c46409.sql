
-- =============================================
-- Fix RLS for catalog_short_links
-- =============================================
DROP POLICY IF EXISTS "Admins can manage short links" ON public.catalog_short_links;

CREATE POLICY "Admins can manage short links"
ON public.catalog_short_links
FOR ALL
USING (
  (is_admin(auth.uid()) AND pdv_id IN (SELECT id FROM pdvs WHERE organization_id = get_user_org_id(auth.uid())))
  OR is_super_admin(auth.uid())
)
WITH CHECK (
  (is_admin(auth.uid()) AND pdv_id IN (SELECT id FROM pdvs WHERE organization_id = get_user_org_id(auth.uid())))
  OR is_super_admin(auth.uid())
);

-- =============================================
-- Fix RLS for pdv_catalog_settings (admin policy only)
-- =============================================
DROP POLICY IF EXISTS "Admins can manage pdv catalog settings" ON public.pdv_catalog_settings;

CREATE POLICY "Admins can manage pdv catalog settings"
ON public.pdv_catalog_settings
FOR ALL
USING (
  (is_admin(auth.uid()) AND pdv_id IN (SELECT id FROM pdvs WHERE organization_id = get_user_org_id(auth.uid())))
  OR is_super_admin(auth.uid())
)
WITH CHECK (
  (is_admin(auth.uid()) AND pdv_id IN (SELECT id FROM pdvs WHERE organization_id = get_user_org_id(auth.uid())))
  OR is_super_admin(auth.uid())
);

-- =============================================
-- Fix RLS for pdv_marketing_media (admin policy only)
-- =============================================
DROP POLICY IF EXISTS "Admins can manage pdv media" ON public.pdv_marketing_media;

CREATE POLICY "Admins can manage pdv media"
ON public.pdv_marketing_media
FOR ALL
USING (
  (is_admin(auth.uid()) AND pdv_id IN (SELECT id FROM pdvs WHERE organization_id = get_user_org_id(auth.uid())))
  OR is_super_admin(auth.uid())
)
WITH CHECK (
  (is_admin(auth.uid()) AND pdv_id IN (SELECT id FROM pdvs WHERE organization_id = get_user_org_id(auth.uid())))
  OR is_super_admin(auth.uid())
);

-- =============================================
-- Fix RLS for link_click_events
-- =============================================
DROP POLICY IF EXISTS "Admins can view click events" ON public.link_click_events;

CREATE POLICY "Admins can view click events"
ON public.link_click_events
FOR SELECT
USING (
  (is_admin(auth.uid()) AND short_link_id IN (
    SELECT csl.id FROM catalog_short_links csl
    JOIN pdvs p ON csl.pdv_id = p.id
    WHERE p.organization_id = get_user_org_id(auth.uid())
  ))
  OR is_super_admin(auth.uid())
);
