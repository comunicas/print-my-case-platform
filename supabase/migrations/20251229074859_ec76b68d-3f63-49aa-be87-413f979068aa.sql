-- =====================================================
-- FASE 3: Correções de Segurança RLS
-- =====================================================

-- 1. Remover policy que permite SELECT público em organizations para super_admins
-- (já existe "Users can view their own organization" e "Admins can view organizations")
-- Não há policy pública, então vamos garantir que sales_records tenha policies completas

-- 2. Adicionar policies de UPDATE e DELETE para sales_records (apenas admins podem fazer isso)

-- Policy para admins deletarem sales_records da sua organização
CREATE POLICY "Admins can delete sales records"
ON public.sales_records
FOR DELETE
USING (
  is_admin(auth.uid()) AND 
  pdv_id IN (
    SELECT id FROM pdvs WHERE organization_id = get_user_org_id(auth.uid())
  )
);

-- Policy para admins atualizarem sales_records da sua organização  
CREATE POLICY "Admins can update sales records"
ON public.sales_records
FOR UPDATE
USING (
  is_admin(auth.uid()) AND 
  pdv_id IN (
    SELECT id FROM pdvs WHERE organization_id = get_user_org_id(auth.uid())
  )
);

-- 3. Adicionar policy de DELETE para stock_records (faltava)
CREATE POLICY "Admins can delete stock records"
ON public.stock_records
FOR DELETE
USING (
  is_admin(auth.uid()) AND 
  pdv_id IN (
    SELECT id FROM pdvs WHERE organization_id = get_user_org_id(auth.uid())
  )
);

-- 4. Adicionar policy de UPDATE para stock_records (faltava)
CREATE POLICY "Admins can update stock records"
ON public.stock_records
FOR UPDATE
USING (
  is_admin(auth.uid()) AND 
  pdv_id IN (
    SELECT id FROM pdvs WHERE organization_id = get_user_org_id(auth.uid())
  )
);

-- 5. Adicionar policy de DELETE para stock_history (faltava)
CREATE POLICY "Admins can delete stock history"
ON public.stock_history
FOR DELETE
USING (
  is_admin(auth.uid()) AND 
  pdv_id IN (
    SELECT id FROM pdvs WHERE organization_id = get_user_org_id(auth.uid())
  )
);