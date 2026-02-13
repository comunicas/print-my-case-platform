
-- Tabela catalog_short_links
CREATE TABLE public.catalog_short_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pdv_id UUID NOT NULL REFERENCES public.pdvs(id) ON DELETE CASCADE,
  short_code TEXT NOT NULL UNIQUE,
  target_url TEXT NOT NULL,
  click_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela link_click_events
CREATE TABLE public.link_click_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_link_id UUID NOT NULL REFERENCES public.catalog_short_links(id) ON DELETE CASCADE,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  referrer TEXT,
  user_agent TEXT,
  ip_hash TEXT
);

CREATE INDEX idx_link_click_events_short_link_id ON public.link_click_events(short_link_id);
CREATE INDEX idx_catalog_short_links_pdv_id ON public.catalog_short_links(pdv_id);
CREATE INDEX idx_catalog_short_links_short_code ON public.catalog_short_links(short_code);

-- Trigger updated_at
CREATE TRIGGER update_catalog_short_links_updated_at
  BEFORE UPDATE ON public.catalog_short_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função atômica para incrementar click_count
CREATE OR REPLACE FUNCTION public.increment_click_count(p_short_code TEXT)
RETURNS TABLE(target_url TEXT, short_link_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_url TEXT;
  v_id UUID;
BEGIN
  UPDATE catalog_short_links
  SET click_count = click_count + 1
  WHERE short_code = p_short_code
  RETURNING catalog_short_links.target_url, catalog_short_links.id
  INTO v_target_url, v_id;

  IF v_target_url IS NULL THEN
    RAISE EXCEPTION 'Short link not found';
  END IF;

  RETURN QUERY SELECT v_target_url, v_id;
END;
$$;

-- RLS catalog_short_links
ALTER TABLE public.catalog_short_links ENABLE ROW LEVEL SECURITY;

-- Leitura pública (para redirect funcionar)
CREATE POLICY "Anyone can read short links"
  ON public.catalog_short_links
  FOR SELECT
  USING (true);

-- Admins gerenciam short links dos PDVs da org
CREATE POLICY "Admins can manage short links"
  ON public.catalog_short_links
  FOR ALL
  USING (
    is_admin(auth.uid()) AND pdv_id IN (
      SELECT id FROM pdvs WHERE organization_id = get_user_org_id(auth.uid())
    )
  )
  WITH CHECK (
    is_admin(auth.uid()) AND pdv_id IN (
      SELECT id FROM pdvs WHERE organization_id = get_user_org_id(auth.uid())
    )
  );

-- RLS link_click_events
ALTER TABLE public.link_click_events ENABLE ROW LEVEL SECURITY;

-- Admins podem ver eventos dos seus links
CREATE POLICY "Admins can view click events"
  ON public.link_click_events
  FOR SELECT
  USING (
    is_admin(auth.uid()) AND short_link_id IN (
      SELECT csl.id FROM catalog_short_links csl
      INNER JOIN pdvs p ON csl.pdv_id = p.id
      WHERE p.organization_id = get_user_org_id(auth.uid())
    )
  );

-- Insert público para registrar cliques (via service role na edge function)
-- Não precisa de policy pública pois a edge function usa service role
