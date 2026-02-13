
-- Defense-in-depth: explicitly revoke all permissions from anon role on sensitive tables
-- Even though existing RESTRICTIVE RLS policies already deny access (auth.uid() is NULL for anon),
-- this adds an extra layer by revoking table-level permissions entirely.

REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.organizations FROM anon;
