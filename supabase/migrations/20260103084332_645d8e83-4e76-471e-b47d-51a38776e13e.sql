-- Atualizar política de pdv_marketing_media para usar user_can_access_pdv
DROP POLICY IF EXISTS "Users can view pdv media" ON pdv_marketing_media;

CREATE POLICY "Users can view pdv media" 
ON pdv_marketing_media
FOR SELECT
USING (user_can_access_pdv(auth.uid(), pdv_id));

-- Adicionar política para usuários verem configurações de catálogo dos PDVs que têm acesso
CREATE POLICY "Users can view pdv catalog settings" 
ON pdv_catalog_settings
FOR SELECT
USING (user_can_access_pdv(auth.uid(), pdv_id));