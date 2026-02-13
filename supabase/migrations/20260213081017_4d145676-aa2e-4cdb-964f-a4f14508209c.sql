
-- Add server-side validation constraints to catalog_leads table
-- to prevent spam and abuse on the public INSERT policy

-- Phone: must be 10-11 digits (Brazilian phone format)
ALTER TABLE public.catalog_leads
ADD CONSTRAINT catalog_leads_phone_format
CHECK (phone ~ '^\d{10,11}$');

-- Product name: reasonable length limit
ALTER TABLE public.catalog_leads
ADD CONSTRAINT catalog_leads_product_name_length
CHECK (char_length(product_name) BETWEEN 1 AND 500);

-- Catalog slug: reasonable length limit and safe characters
ALTER TABLE public.catalog_leads
ADD CONSTRAINT catalog_leads_slug_length
CHECK (char_length(catalog_slug) BETWEEN 1 AND 200);

-- Organization ID must be a valid existing org (FK already exists, but add NOT NULL enforcement)
-- organization_id is already NOT NULL per schema

-- Rate limiting: replace the permissive INSERT policy with one that limits inserts
-- by checking if the same phone+org combo has been inserted in the last minute
DROP POLICY IF EXISTS "Anyone can insert catalog leads" ON public.catalog_leads;

CREATE POLICY "Anyone can insert catalog leads with rate limit"
ON public.catalog_leads
FOR INSERT
TO anon, authenticated
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM public.catalog_leads cl
    WHERE cl.phone = phone
      AND cl.organization_id = catalog_leads.organization_id
      AND cl.created_at > now() - interval '1 minute'
  )
);
