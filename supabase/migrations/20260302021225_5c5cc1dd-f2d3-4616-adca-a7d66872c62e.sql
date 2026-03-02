
-- ============================================================
-- Super Admin bypass: adicionar is_super_admin() em todas as
-- políticas que ainda não possuem esse bypass
-- ============================================================

-- 1. UPLOADS
DROP POLICY "Users can create uploads" ON uploads;
CREATE POLICY "Users can create uploads" ON uploads
  FOR INSERT TO authenticated
  WITH CHECK (
    is_super_admin(auth.uid())
    OR (
      uploaded_by = auth.uid()
      AND pdv_id IN (SELECT id FROM pdvs WHERE organization_id = get_user_org_id(auth.uid()))
      AND NOT has_role(auth.uid(), 'viewer'::app_role)
    )
  );

DROP POLICY "Users can update their own uploads" ON uploads;
CREATE POLICY "Users can update their own uploads" ON uploads
  FOR UPDATE TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR (
      uploaded_by = auth.uid()
      AND pdv_id IN (SELECT id FROM pdvs WHERE organization_id = get_user_org_id(auth.uid()))
    )
  );

DROP POLICY "Admins can delete uploads" ON uploads;
CREATE POLICY "Admins can delete uploads" ON uploads
  FOR DELETE TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR (
      is_admin(auth.uid())
      AND pdv_id IN (SELECT id FROM pdvs WHERE organization_id = get_user_org_id(auth.uid()))
    )
  );

-- 2. SALES_RECORDS
DROP POLICY "System can insert sales records" ON sales_records;
CREATE POLICY "System can insert sales records" ON sales_records
  FOR INSERT TO authenticated
  WITH CHECK (
    is_super_admin(auth.uid())
    OR pdv_id IN (SELECT id FROM pdvs WHERE organization_id = get_user_org_id(auth.uid()))
  );

DROP POLICY "Admins can update sales records" ON sales_records;
CREATE POLICY "Admins can update sales records" ON sales_records
  FOR UPDATE TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR (
      is_admin(auth.uid())
      AND pdv_id IN (SELECT id FROM pdvs WHERE organization_id = get_user_org_id(auth.uid()))
    )
  );

DROP POLICY "Admins can delete sales records" ON sales_records;
CREATE POLICY "Admins can delete sales records" ON sales_records
  FOR DELETE TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR (
      is_admin(auth.uid())
      AND pdv_id IN (SELECT id FROM pdvs WHERE organization_id = get_user_org_id(auth.uid()))
    )
  );

-- 3. STOCK_RECORDS
DROP POLICY "System can insert stock records" ON stock_records;
CREATE POLICY "System can insert stock records" ON stock_records
  FOR INSERT TO authenticated
  WITH CHECK (
    is_super_admin(auth.uid())
    OR pdv_id IN (SELECT id FROM pdvs WHERE organization_id = get_user_org_id(auth.uid()))
  );

DROP POLICY "Admins can update stock records" ON stock_records;
CREATE POLICY "Admins can update stock records" ON stock_records
  FOR UPDATE TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR (
      is_admin(auth.uid())
      AND pdv_id IN (SELECT id FROM pdvs WHERE organization_id = get_user_org_id(auth.uid()))
    )
  );

DROP POLICY "Admins can delete stock records" ON stock_records;
CREATE POLICY "Admins can delete stock records" ON stock_records
  FOR DELETE TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR (
      is_admin(auth.uid())
      AND pdv_id IN (SELECT id FROM pdvs WHERE organization_id = get_user_org_id(auth.uid()))
    )
  );

-- 4. STOCK_HISTORY
DROP POLICY "System can insert stock history" ON stock_history;
CREATE POLICY "System can insert stock history" ON stock_history
  FOR INSERT TO authenticated
  WITH CHECK (
    is_super_admin(auth.uid())
    OR pdv_id IN (SELECT id FROM pdvs WHERE organization_id = get_user_org_id(auth.uid()))
  );

DROP POLICY "System can update stock history" ON stock_history;
CREATE POLICY "System can update stock history" ON stock_history
  FOR UPDATE TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR pdv_id IN (SELECT id FROM pdvs WHERE organization_id = get_user_org_id(auth.uid()))
  );

DROP POLICY "Admins can delete stock history" ON stock_history;
CREATE POLICY "Admins can delete stock history" ON stock_history
  FOR DELETE TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR (
      is_admin(auth.uid())
      AND pdv_id IN (SELECT id FROM pdvs WHERE organization_id = get_user_org_id(auth.uid()))
    )
  );

-- 5. UPLOAD_ANOMALIES
DROP POLICY "System can insert anomalies" ON upload_anomalies;
CREATE POLICY "System can insert anomalies" ON upload_anomalies
  FOR INSERT TO authenticated
  WITH CHECK (
    is_super_admin(auth.uid())
    OR upload_id IN (
      SELECT id FROM uploads
      WHERE pdv_id IN (SELECT id FROM pdvs WHERE organization_id = get_user_org_id(auth.uid()))
    )
  );

DROP POLICY "Admins can delete anomalies" ON upload_anomalies;
CREATE POLICY "Admins can delete anomalies" ON upload_anomalies
  FOR DELETE TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR (
      is_admin(auth.uid())
      AND upload_id IN (
        SELECT id FROM uploads
        WHERE pdv_id IN (SELECT id FROM pdvs WHERE organization_id = get_user_org_id(auth.uid()))
      )
    )
  );

-- 6. FINANCIAL_ENTRIES
DROP POLICY "Admins can create financial entries" ON financial_entries;
CREATE POLICY "Admins can create financial entries" ON financial_entries
  FOR INSERT TO authenticated
  WITH CHECK (
    is_super_admin(auth.uid())
    OR (
      is_admin(auth.uid())
      AND organization_id = get_user_org_id(auth.uid())
      AND created_by = auth.uid()
    )
  );

DROP POLICY "Admins can update financial entries" ON financial_entries;
CREATE POLICY "Admins can update financial entries" ON financial_entries
  FOR UPDATE TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR (
      is_admin(auth.uid())
      AND organization_id = get_user_org_id(auth.uid())
    )
  );

DROP POLICY "Admins can delete financial entries" ON financial_entries;
CREATE POLICY "Admins can delete financial entries" ON financial_entries
  FOR DELETE TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR (
      is_admin(auth.uid())
      AND organization_id = get_user_org_id(auth.uid())
    )
  );

-- 7. PRODUCTS
DROP POLICY "Admins can manage products" ON products;
CREATE POLICY "Admins can manage products" ON products
  FOR ALL TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR (
      organization_id = get_user_org_id(auth.uid())
      AND is_admin(auth.uid())
    )
  )
  WITH CHECK (
    is_super_admin(auth.uid())
    OR (
      organization_id = get_user_org_id(auth.uid())
      AND is_admin(auth.uid())
    )
  );

-- 8. PRODUCT_REQUESTS
DROP POLICY "Admins can view product requests" ON product_requests;
CREATE POLICY "Admins can view product requests" ON product_requests
  FOR SELECT TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR (
      is_admin(auth.uid())
      AND organization_id = get_user_org_id(auth.uid())
    )
  );

DROP POLICY "Admins can update product requests" ON product_requests;
CREATE POLICY "Admins can update product requests" ON product_requests
  FOR UPDATE TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR (
      is_admin(auth.uid())
      AND organization_id = get_user_org_id(auth.uid())
    )
  );

DROP POLICY "Admins can delete product requests" ON product_requests;
CREATE POLICY "Admins can delete product requests" ON product_requests
  FOR DELETE TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR (
      is_admin(auth.uid())
      AND organization_id = get_user_org_id(auth.uid())
    )
  );

-- 9. NOTIFICATIONS
DROP POLICY "Users can view their notifications" ON notifications;
CREATE POLICY "Users can view their notifications" ON notifications
  FOR SELECT TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR (
      organization_id = get_user_org_id(auth.uid())
      AND (user_id IS NULL OR user_id = auth.uid())
    )
    OR (
      user_has_org_access(auth.uid(), organization_id)
      AND user_id IS NULL
    )
  );

DROP POLICY "Admins can insert notifications for their org" ON notifications;
CREATE POLICY "Admins can insert notifications for their org" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    is_super_admin(auth.uid())
    OR (
      organization_id = get_user_org_id(auth.uid())
      AND is_admin(auth.uid())
    )
  );

DROP POLICY "Users can update their notifications" ON notifications;
CREATE POLICY "Users can update their notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR (
      organization_id = get_user_org_id(auth.uid())
      AND (user_id IS NULL OR user_id = auth.uid())
    )
  )
  WITH CHECK (
    is_super_admin(auth.uid())
    OR (
      organization_id = get_user_org_id(auth.uid())
      AND (user_id IS NULL OR user_id = auth.uid())
    )
  );

DROP POLICY "Admins can delete notifications" ON notifications;
CREATE POLICY "Admins can delete notifications" ON notifications
  FOR DELETE TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR (
      organization_id = get_user_org_id(auth.uid())
      AND is_admin(auth.uid())
    )
  );

-- 10. USER_PDVS
DROP POLICY "Admins can manage user_pdvs in their org" ON user_pdvs;
CREATE POLICY "Admins can manage user_pdvs in their org" ON user_pdvs
  FOR ALL TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR (
      is_admin(auth.uid())
      AND pdv_id IN (SELECT id FROM pdvs WHERE organization_id = get_user_org_id(auth.uid()))
    )
  )
  WITH CHECK (
    is_super_admin(auth.uid())
    OR (
      is_admin(auth.uid())
      AND pdv_id IN (SELECT id FROM pdvs WHERE organization_id = get_user_org_id(auth.uid()))
    )
  );

-- 11. CATALOG_LEADS
DROP POLICY "Admins can delete catalog leads" ON catalog_leads;
CREATE POLICY "Admins can delete catalog leads" ON catalog_leads
  FOR DELETE TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR (
      is_admin(auth.uid())
      AND organization_id = get_user_org_id(auth.uid())
    )
  );
