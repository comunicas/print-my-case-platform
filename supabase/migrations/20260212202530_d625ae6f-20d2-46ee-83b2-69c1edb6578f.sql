
-- 1. Criar tabela api_keys
CREATE TABLE public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index para busca por hash
CREATE INDEX idx_api_keys_key_hash ON public.api_keys (key_hash);
CREATE INDEX idx_api_keys_organization_id ON public.api_keys (organization_id);

-- RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view api keys"
  ON public.api_keys FOR SELECT
  USING (organization_id = get_user_org_id(auth.uid()) AND is_admin(auth.uid()));

CREATE POLICY "Admins can create api keys"
  ON public.api_keys FOR INSERT
  WITH CHECK (organization_id = get_user_org_id(auth.uid()) AND is_admin(auth.uid()));

CREATE POLICY "Admins can update api keys"
  ON public.api_keys FOR UPDATE
  USING (organization_id = get_user_org_id(auth.uid()) AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete api keys"
  ON public.api_keys FOR DELETE
  USING (organization_id = get_user_org_id(auth.uid()) AND is_admin(auth.uid()));

-- 2. Alterar sales_records: upload_id nullable e coluna source
ALTER TABLE public.sales_records ALTER COLUMN upload_id DROP NOT NULL;

ALTER TABLE public.sales_records ADD COLUMN source TEXT NOT NULL DEFAULT 'spreadsheet';
