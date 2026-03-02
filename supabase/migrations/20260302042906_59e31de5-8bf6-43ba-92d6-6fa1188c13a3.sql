
-- Create dre_config table
CREATE TABLE public.dre_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  pdv_id uuid REFERENCES public.pdvs(id),
  unit_cost numeric NOT NULL DEFAULT 0,
  stone_rate numeric NOT NULL DEFAULT 0,
  tax_rate numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, pdv_id)
);

-- Enable RLS
ALTER TABLE public.dre_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies (PERMISSIVE)
CREATE POLICY "Admins can select dre_config"
  ON public.dre_config FOR SELECT TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR (is_admin(auth.uid()) AND organization_id = get_user_org_id(auth.uid()))
  );

CREATE POLICY "Admins can insert dre_config"
  ON public.dre_config FOR INSERT TO authenticated
  WITH CHECK (
    is_super_admin(auth.uid())
    OR (is_admin(auth.uid()) AND organization_id = get_user_org_id(auth.uid()))
  );

CREATE POLICY "Admins can update dre_config"
  ON public.dre_config FOR UPDATE TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR (is_admin(auth.uid()) AND organization_id = get_user_org_id(auth.uid()))
  );

CREATE POLICY "Admins can delete dre_config"
  ON public.dre_config FOR DELETE TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR (is_admin(auth.uid()) AND organization_id = get_user_org_id(auth.uid()))
  );

-- Trigger for updated_at
CREATE TRIGGER update_dre_config_updated_at
  BEFORE UPDATE ON public.dre_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
