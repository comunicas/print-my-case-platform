import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';
import { useCallback, useMemo, useRef } from 'react';

export function usePrefetchRoutes() {
  const queryClient = useQueryClient();
  const { profile, role } = useProfile();
  const isSuperAdmin = role === "super_admin";
  
  // Debounce refs para evitar múltiplos prefetches
  const timeoutRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  
  // Função de debounce
  const debounce = useCallback((key: string, fn: () => void, ms: number = 150) => {
    if (timeoutRefs.current[key]) {
      clearTimeout(timeoutRefs.current[key]);
    }
    timeoutRefs.current[key] = setTimeout(fn, ms);
  }, []);
  
  // Prefetch Organizations data (super admin only)
  const prefetchOrganizations = useCallback(() => {
    debounce('organizations', () => {
      if (!isSuperAdmin) return;
      
      const cacheKey = ["organizations"];
      const existingData = queryClient.getQueryState(cacheKey);
      if (existingData?.data && existingData.dataUpdatedAt > Date.now() - 2 * 60 * 1000) return;
      
      queryClient.prefetchQuery({
        queryKey: cacheKey,
        staleTime: 2 * 60 * 1000,
        queryFn: async () => {
          const { data } = await supabase
            .from("organizations")
            .select("id, name, owner_id, plan, active_since")
            .order("name");
          return data || [];
        },
      });
    });
  }, [queryClient, isSuperAdmin, debounce]);

  // Prefetch Marketing PDVs data
  const prefetchMarketing = useCallback(() => {
    debounce('marketing', () => {
      if (!profile?.organization_id) return;
      
      const pdvsCacheKey = ["pdvs", profile.organization_id];
      const existingPdvsData = queryClient.getQueryState(pdvsCacheKey);
      if (!existingPdvsData?.data || existingPdvsData.dataUpdatedAt < Date.now() - 5 * 60 * 1000) {
        queryClient.prefetchQuery({
          queryKey: pdvsCacheKey,
          staleTime: 5 * 60 * 1000,
          queryFn: async () => {
            const { data } = await supabase
              .from("pdvs")
              .select("id, name, location, status")
              .eq("organization_id", profile.organization_id)
              .order("name");
            return data || [];
          },
        });
      }
    });
  }, [queryClient, profile, debounce]);
  
  // Mapeamento de rotas para funções de prefetch
  // NOTE: Dashboard and Stock prefetches were removed because their query keys
  // and data shapes didn't match the real hooks (useDashboard, useSlotsData),
  // causing duplicate fetches instead of cache hits.
  const prefetchMap = useMemo(() => ({
    "/organizations": prefetchOrganizations,
    "/marketing": prefetchMarketing,
  }), [prefetchOrganizations, prefetchMarketing]);
  
  return {
    prefetchOrganizations,
    prefetchMarketing,
    prefetchMap,
  };
}
