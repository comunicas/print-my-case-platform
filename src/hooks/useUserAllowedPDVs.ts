import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";

export interface UseUserAllowedPDVsResult {
  /**
   * Lista de IDs de PDVs permitidos para o usuário atual.
   * null = sem restrições (super_admin, org_admin, ou usuário sem atribuições específicas)
   */
  allowedPdvIds: string[] | null;
  
  /**
   * Indica se o usuário tem restrições específicas de PDV (vs acesso total à org)
   */
  hasRestrictions: boolean;
  
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook centralizado para obter a lista de PDVs que o usuário pode acessar.
 * 
 * Reflete a mesma lógica da função user_can_access_pdv do banco de dados:
 * - Super admins: acesso total (retorna null)
 * - Org admins: acesso total à organização (retorna null)
 * - Operators/Viewers com atribuições específicas: retorna lista de PDV IDs
 * - Operators/Viewers sem atribuições: fallback para todos da org (retorna null)
 */
export function useUserAllowedPDVs(): UseUserAllowedPDVsResult {
  const { profile, role, isLoading: profileLoading } = useProfile();
  const isSuperAdmin = role === "super_admin";
  const isAdmin = role === "super_admin" || role === "org_admin";

  const query = useQuery({
    queryKey: ["user-allowed-pdvs", profile?.id, role],
    queryFn: async (): Promise<string[] | null> => {
      // Super admins e org_admins não têm restrições
      if (isAdmin) return null;
      
      if (!profile?.id) return null;
      
      // Para operators e viewers, verificar atribuições específicas
      const { data: userPdvs, error } = await supabase
        .from("user_pdvs")
        .select("pdv_id")
        .eq("user_id", profile.id);
      
      if (error) throw error;
      
      // Se tem atribuições específicas, retornar lista
      if (userPdvs && userPdvs.length > 0) {
        return userPdvs.map(p => p.pdv_id);
      }
      
      // Sem atribuições = acesso a todos da org (fallback conforme user_can_access_pdv)
      return null;
    },
    enabled: !!profile?.id && !profileLoading,
    staleTime: 10 * 60 * 1000, // 10 minutos (mesmo tempo do profile)
    gcTime: 60 * 60 * 1000, // 1 hora
  });

  return {
    allowedPdvIds: query.data ?? null,
    hasRestrictions: query.data !== null && query.data !== undefined && query.data.length > 0,
    isLoading: profileLoading || query.isLoading,
    error: query.error,
  };
}
