DROP FUNCTION IF EXISTS public.get_public_organization(text);

CREATE FUNCTION public.get_public_organization(p_slug text)
RETURNS TABLE(id uuid, name text, public_slug text, catalog_code_enabled boolean, catalog_code text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT o.id, o.name, o.public_slug, o.catalog_code_enabled, o.catalog_code
  FROM public.organizations o
  WHERE o.public_slug = p_slug
    AND o.public_catalog_enabled = true
$function$;