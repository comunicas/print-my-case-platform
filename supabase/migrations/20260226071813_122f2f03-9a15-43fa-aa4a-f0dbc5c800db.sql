
-- Tabela financial_entries para despesas manuais do DRE
CREATE TABLE public.financial_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pdv_id UUID REFERENCES pdvs(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('implantacao', 'fixas')),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  reference_month DATE NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.financial_entries ENABLE ROW LEVEL SECURITY;

-- SELECT: todos da org podem ver (admins, operators, viewers)
CREATE POLICY "Users can view financial entries"
ON public.financial_entries FOR SELECT TO authenticated
USING (
  (organization_id = get_user_org_id(auth.uid()))
  OR is_super_admin(auth.uid())
  OR user_has_org_access(auth.uid(), organization_id)
);

-- INSERT: apenas admins
CREATE POLICY "Admins can create financial entries"
ON public.financial_entries FOR INSERT TO authenticated
WITH CHECK (
  is_admin(auth.uid())
  AND organization_id = get_user_org_id(auth.uid())
  AND created_by = auth.uid()
);

-- UPDATE: apenas admins
CREATE POLICY "Admins can update financial entries"
ON public.financial_entries FOR UPDATE TO authenticated
USING (
  is_admin(auth.uid())
  AND organization_id = get_user_org_id(auth.uid())
);

-- DELETE: apenas admins
CREATE POLICY "Admins can delete financial entries"
ON public.financial_entries FOR DELETE TO authenticated
USING (
  is_admin(auth.uid())
  AND organization_id = get_user_org_id(auth.uid())
);

-- Trigger updated_at (reutiliza função existente)
CREATE TRIGGER update_financial_entries_updated_at
BEFORE UPDATE ON public.financial_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index para queries por org + mês
CREATE INDEX idx_financial_entries_org_month 
ON public.financial_entries (organization_id, reference_month);
