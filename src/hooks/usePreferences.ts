import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Preferences {
  id: string;
  user_id: string;
  theme: string;
  language: string;
  email_notifications: boolean;
  stock_alerts: boolean;
  weekly_reports: boolean;
  upload_notifications: boolean;
  default_period: string;
  default_pdv: string | null;
  sidebar_collapsed: boolean;
  sidebar_reports_expanded: boolean;
  created_at: string;
  updated_at: string;
}

export function usePreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const preferencesQuery = useQuery({
    queryKey: ["preferences", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Preferences | null;
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 60 * 60 * 1000, // 1 hora
  });

  const updatePreferences = useMutation({
    mutationFn: async (updates: Partial<Preferences>) => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      
      const { data, error } = await supabase
        .from("preferences")
        .update(updates)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["preferences", user?.id] });
      // Don't show toast for sidebar preference updates
      const isSidebarUpdate = 'sidebar_collapsed' in variables || 'sidebar_reports_expanded' in variables;
      if (!isSidebarUpdate) {
        toast.success("Preferências salvas", {
          description: "Suas preferências foram atualizadas.",
        });
      }
    },
    onError: (error) => {
      toast.error("Erro ao salvar", {
        description: error.message,
      });
    },
  });

  return {
    preferences: preferencesQuery.data,
    isLoading: preferencesQuery.isLoading,
    error: preferencesQuery.error,
    updatePreferences,
  };
}
