
-- Create pre_stock table
CREATE TABLE public.pre_stock (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL,
  pdv_id uuid,
  product_name text NOT NULL,
  quantity integer NOT NULL,
  remaining_quantity integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pre_stock TO authenticated;

-- Enable RLS
ALTER TABLE public.pre_stock ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view pre_stock"
ON public.pre_stock FOR SELECT
TO authenticated
USING (
  (organization_id = get_user_org_id(auth.uid()) AND is_admin(auth.uid()))
  OR is_super_admin(auth.uid())
  OR (organization_id = get_user_org_id(auth.uid()) AND (pdv_id IS NULL OR user_can_access_pdv(auth.uid(), pdv_id)))
);

CREATE POLICY "Admins can insert pre_stock"
ON public.pre_stock FOR INSERT
TO authenticated
WITH CHECK (
  (organization_id = get_user_org_id(auth.uid()) AND is_admin(auth.uid()) AND created_by = auth.uid())
  OR is_super_admin(auth.uid())
);

CREATE POLICY "Admins can update pre_stock"
ON public.pre_stock FOR UPDATE
TO authenticated
USING (
  (organization_id = get_user_org_id(auth.uid()) AND is_admin(auth.uid()))
  OR is_super_admin(auth.uid())
);

CREATE POLICY "Admins can delete pre_stock"
ON public.pre_stock FOR DELETE
TO authenticated
USING (
  (organization_id = get_user_org_id(auth.uid()) AND is_admin(auth.uid()))
  OR is_super_admin(auth.uid())
);

-- Trigger for updated_at
CREATE TRIGGER update_pre_stock_updated_at
BEFORE UPDATE ON public.pre_stock
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Validation trigger for status
CREATE OR REPLACE FUNCTION public.validate_pre_stock_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'allocated') THEN
    RAISE EXCEPTION 'Invalid pre_stock status: %', NEW.status;
  END IF;
  IF NEW.remaining_quantity < 0 THEN
    NEW.remaining_quantity := 0;
  END IF;
  IF NEW.remaining_quantity = 0 AND NEW.status = 'pending' THEN
    NEW.status := 'allocated';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_pre_stock_status_trigger
BEFORE INSERT OR UPDATE ON public.pre_stock
FOR EACH ROW
EXECUTE FUNCTION public.validate_pre_stock_status();
