-- Create table to store excluded anomaly records
CREATE TABLE upload_anomalies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  upload_id uuid NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
  order_number text NOT NULL,
  product_name text NOT NULL,
  amount numeric NOT NULL,
  reason text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Index for faster lookups by upload
CREATE INDEX idx_upload_anomalies_upload_id ON upload_anomalies(upload_id);

-- Enable RLS
ALTER TABLE upload_anomalies ENABLE ROW LEVEL SECURITY;

-- Users can view anomalies of uploads they can access
CREATE POLICY "Users can view anomalies of accessible uploads"
ON upload_anomalies FOR SELECT
USING (
  upload_id IN (
    SELECT id FROM uploads WHERE user_can_access_pdv(auth.uid(), pdv_id)
  )
);

-- System can insert anomalies during processing
CREATE POLICY "System can insert anomalies"
ON upload_anomalies FOR INSERT
WITH CHECK (
  upload_id IN (
    SELECT id FROM uploads WHERE pdv_id IN (
      SELECT id FROM pdvs WHERE organization_id = get_user_org_id(auth.uid())
    )
  )
);

-- Admins can delete anomalies
CREATE POLICY "Admins can delete anomalies"
ON upload_anomalies FOR DELETE
USING (
  is_admin(auth.uid()) AND upload_id IN (
    SELECT id FROM uploads WHERE pdv_id IN (
      SELECT id FROM pdvs WHERE organization_id = get_user_org_id(auth.uid())
    )
  )
);

-- Add anomaly_count column to uploads table
ALTER TABLE uploads ADD COLUMN anomaly_count integer DEFAULT 0;