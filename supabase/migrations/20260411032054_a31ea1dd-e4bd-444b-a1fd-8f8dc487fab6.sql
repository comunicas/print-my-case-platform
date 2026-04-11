
CREATE TABLE public.pending_allocations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  upload_id UUID,
  pdv_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  suggested_quantity INTEGER NOT NULL,
  pre_stock_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID
);

ALTER TABLE public.pending_allocations ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pending_allocations TO authenticated;

CREATE POLICY "Admins can view pending allocations"
  ON public.pending_allocations FOR SELECT TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR (is_admin(auth.uid()) AND organization_id = get_user_org_id(auth.uid()))
  );

CREATE POLICY "System can insert pending allocations"
  ON public.pending_allocations FOR INSERT TO authenticated
  WITH CHECK (
    is_super_admin(auth.uid())
    OR (organization_id = get_user_org_id(auth.uid()))
  );

CREATE POLICY "Admins can update pending allocations"
  ON public.pending_allocations FOR UPDATE TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR (is_admin(auth.uid()) AND organization_id = get_user_org_id(auth.uid()))
  );

CREATE POLICY "Admins can delete pending allocations"
  ON public.pending_allocations FOR DELETE TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR (is_admin(auth.uid()) AND organization_id = get_user_org_id(auth.uid()))
  );

CREATE INDEX idx_pending_allocations_org_status ON public.pending_allocations (organization_id, status);
CREATE INDEX idx_pending_allocations_pre_stock ON public.pending_allocations (pre_stock_id);
