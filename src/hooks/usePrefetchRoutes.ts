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
  
  // Prefetch Dashboard data
  const prefetchDashboard = useCallback(() => {
    debounce('dashboard', () => {
      if (!profile?.organization_id && !isSuperAdmin) return;
      
      // Verifica se já está em cache
      const cacheKey = ["dashboard", profile?.organization_id, undefined, undefined, isSuperAdmin, undefined, undefined];
      const existingData = queryClient.getQueryState(cacheKey);
      if (existingData?.data && existingData.dataUpdatedAt > Date.now() - 2 * 60 * 1000) return;
      
      queryClient.prefetchQuery({
        queryKey: cacheKey,
        staleTime: 2 * 60 * 1000,
        queryFn: async () => {
          // Query simplificada - dados básicos para carregamento inicial rápido
          const { data: salesData } = await supabase
            .from("sales_records")
            .select("id, amount, refund_amount, payment_date, product_name, pdv_id")
            .order("payment_date", { ascending: false })
            .limit(500);
          
          return { salesData };
        },
      });
    });
  }, [queryClient, profile, isSuperAdmin, debounce]);
  
  // Prefetch Stock data
  const prefetchStock = useCallback(() => {
    debounce('stock', () => {
      const cacheKey = ["slots-data", undefined, profile?.id];
      const existingData = queryClient.getQueryState(cacheKey);
      if (existingData?.data && existingData.dataUpdatedAt > Date.now() - 5 * 60 * 1000) return;
      
      queryClient.prefetchQuery({
        queryKey: cacheKey,
        staleTime: 5 * 60 * 1000,
        queryFn: async () => {
          const { data } = await supabase
            .from("stock_records")
            .select("id, slot_number, product_name, quantity, pdv_id, is_active, upload_id")
            .limit(500);
          return data || [];
        },
      });
      
      // Também prefetch sales summary para o stock
      queryClient.prefetchQuery({
        queryKey: ['sales-summary', undefined],
        staleTime: 5 * 60 * 1000,
        queryFn: async () => {
          const { data } = await supabase
            .from("sales_records")
            .select("product_name")
            .limit(1000);
          return data || [];
        },
      });
    });
  }, [queryClient, profile, debounce]);

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
  
  // Mapeamento de rotas para funções de prefetch
  const prefetchMap = useMemo(() => ({
    "/": prefetchDashboard,
    "/organizations": prefetchOrganizations,
    "/estoque": prefetchStock,
  }), [prefetchDashboard, prefetchOrganizations, prefetchStock]);
  
  return {
    prefetchDashboard,
    prefetchStock,
    prefetchOrganizations,
    prefetchMap,
  };
}
