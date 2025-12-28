-- Create stock_history table for tracking stock evolution over time
CREATE TABLE public.stock_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pdv_id UUID NOT NULL REFERENCES public.pdvs(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  brand TEXT NOT NULL,
  total_quantity INTEGER NOT NULL DEFAULT 0,
  active_slots INTEGER NOT NULL DEFAULT 0,
  upload_id UUID REFERENCES public.uploads(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_stock_history_org_date ON public.stock_history(organization_id, snapshot_date);
CREATE INDEX idx_stock_history_pdv_date ON public.stock_history(pdv_id, snapshot_date);
CREATE INDEX idx_stock_history_date ON public.stock_history(snapshot_date);

-- Unique constraint to avoid duplicates (same pdv, date, brand)
CREATE UNIQUE INDEX idx_stock_history_unique ON public.stock_history(pdv_id, snapshot_date, brand);

-- Enable Row Level Security
ALTER TABLE public.stock_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view stock history of their organization"
  ON public.stock_history FOR SELECT
  USING (
    organization_id = get_user_org_id(auth.uid()) 
    OR is_super_admin(auth.uid())
  );

CREATE POLICY "System can insert stock history"
  ON public.stock_history FOR INSERT
  WITH CHECK (
    pdv_id IN (
      SELECT id FROM pdvs WHERE organization_id = get_user_org_id(auth.uid())
    )
  );

CREATE POLICY "System can update stock history"
  ON public.stock_history FOR UPDATE
  USING (
    pdv_id IN (
      SELECT id FROM pdvs WHERE organization_id = get_user_org_id(auth.uid())
    )
  );