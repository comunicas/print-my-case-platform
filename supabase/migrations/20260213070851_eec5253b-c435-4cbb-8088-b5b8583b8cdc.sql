
-- Fix 1: Remove public SELECT on catalog_short_links
-- The redirect-short-link edge function uses service_role (bypasses RLS),
-- and admin management uses the "Admins can manage short links" policy.
-- No client-side code needs anonymous access to this table.
DROP POLICY IF EXISTS "Anyone can read short links" ON public.catalog_short_links;

-- Fix 2: Remove public SELECT on pdv_catalog_settings
-- Public catalog pages use get_public_organization() RPC which is SECURITY DEFINER.
-- Admin management uses "Admins can manage pdv catalog settings" policy.
-- The broad public SELECT exposes internal config unnecessarily.
DROP POLICY IF EXISTS "Public can view enabled pdv catalog settings" ON public.pdv_catalog_settings;

-- Fix 3: Remove overly permissive INSERT on link_click_events
-- The redirect-short-link edge function inserts using service_role (bypasses RLS).
-- No anonymous client-side code inserts into this table directly.
DROP POLICY IF EXISTS "Allow insert click events" ON public.link_click_events;
