ALTER TABLE public.organizations 
ADD COLUMN catalog_code_enabled BOOLEAN DEFAULT false,
ADD COLUMN catalog_code TEXT;