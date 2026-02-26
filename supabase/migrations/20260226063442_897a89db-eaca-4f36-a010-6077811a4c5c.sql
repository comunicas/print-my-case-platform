
-- Phase 1A: Clean corrupted cross-org user_pdvs entries
DELETE FROM public.user_pdvs
WHERE id IN (
  SELECT up.id FROM public.user_pdvs up
  JOIN public.profiles pr ON up.user_id = pr.id
  JOIN public.pdvs p ON up.pdv_id = p.id
  WHERE pr.organization_id != p.organization_id
);

-- Phase 1B: Fix user_can_access_pdv to validate org on user_pdvs branch
CREATE OR REPLACE FUNCTION public.user_can_access_pdv(_user_id uuid, _pdv_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT 
    is_super_admin(_user_id)
    OR (is_admin(_user_id) AND _pdv_id IN (
      SELECT id FROM pdvs WHERE organization_id = get_user_org_id(_user_id)
    ))
    OR EXISTS (
      SELECT 1 FROM user_pdvs up
      JOIN pdvs p ON up.pdv_id = p.id
      WHERE up.user_id = _user_id
        AND up.pdv_id = _pdv_id
        AND p.organization_id = get_user_org_id(_user_id)
    )
    OR (
      NOT EXISTS (SELECT 1 FROM user_pdvs WHERE user_id = _user_id)
      AND _pdv_id IN (
        SELECT id FROM pdvs WHERE organization_id = get_user_org_id(_user_id)
      )
    )
    OR EXISTS (
      SELECT 1 FROM user_org_access uoa
      JOIN pdvs p ON p.organization_id = uoa.organization_id
      WHERE uoa.user_id = _user_id AND p.id = _pdv_id
    )
$$;

-- Phase 1C: Preventive trigger to block future cross-org assignments
CREATE OR REPLACE FUNCTION public.validate_user_pdv_same_org()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles pr
    JOIN pdvs p ON p.organization_id = pr.organization_id
    WHERE pr.id = NEW.user_id AND p.id = NEW.pdv_id
  ) THEN
    RAISE EXCEPTION 'user_pdv cross-org assignment not allowed: user and PDV belong to different organizations';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_user_pdv
BEFORE INSERT OR UPDATE ON public.user_pdvs
FOR EACH ROW EXECUTE FUNCTION public.validate_user_pdv_same_org();
