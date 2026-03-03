
-- Grant table-level permissions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO authenticated;
