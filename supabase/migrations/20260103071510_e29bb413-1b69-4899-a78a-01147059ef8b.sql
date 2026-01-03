-- Create table for marketing media per PDV
CREATE TABLE public.pdv_marketing_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pdv_id UUID NOT NULL REFERENCES public.pdvs(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pdv_marketing_media ENABLE ROW LEVEL SECURITY;

-- Admins can manage media for PDVs in their organization
CREATE POLICY "Admins can manage pdv media"
  ON public.pdv_marketing_media FOR ALL
  USING (
    is_admin(auth.uid()) AND 
    pdv_id IN (SELECT id FROM pdvs WHERE organization_id = get_user_org_id(auth.uid()))
  )
  WITH CHECK (
    is_admin(auth.uid()) AND 
    pdv_id IN (SELECT id FROM pdvs WHERE organization_id = get_user_org_id(auth.uid()))
  );

-- Users can view media from their organization's PDVs
CREATE POLICY "Users can view pdv media"
  ON public.pdv_marketing_media FOR SELECT
  USING (
    pdv_id IN (SELECT id FROM pdvs WHERE organization_id = get_user_org_id(auth.uid()))
  );

-- Create trigger for updated_at
CREATE TRIGGER update_pdv_marketing_media_updated_at
  BEFORE UPDATE ON public.pdv_marketing_media
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for marketing media
INSERT INTO storage.buckets (id, name, public) VALUES ('marketing-media', 'marketing-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for marketing media bucket
CREATE POLICY "Admins can upload marketing media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'marketing-media' AND 
    is_admin(auth.uid())
  );

CREATE POLICY "Admins can update marketing media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'marketing-media' AND 
    is_admin(auth.uid())
  );

CREATE POLICY "Admins can delete marketing media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'marketing-media' AND 
    is_admin(auth.uid())
  );

CREATE POLICY "Anyone can view marketing media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'marketing-media');