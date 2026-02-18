
-- Remover o trigger e função que bloqueia a desvinculação de membros (usando CASCADE)
DROP TRIGGER IF EXISTS tr_prevent_orphan_profile ON public.profiles;
DROP FUNCTION IF EXISTS public.prevent_orphan_profile() CASCADE;
