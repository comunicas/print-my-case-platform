DROP POLICY IF EXISTS "Users can create uploads" ON uploads;

CREATE POLICY "Users can create uploads"
ON uploads FOR INSERT TO authenticated
WITH CHECK (
  uploaded_by = auth.uid()
  AND pdv_id IN (
    SELECT id FROM pdvs WHERE organization_id = get_user_org_id(auth.uid())
  )
  AND NOT has_role(auth.uid(), 'viewer')
);