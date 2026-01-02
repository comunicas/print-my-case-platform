import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface PDVCatalogSettings {
  id: string;
  pdv_id: string;
  catalog_code: string | null;
  catalog_qrcode_url: string | null;
  catalog_modal_text: string | null;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface PDVWithCatalogSettings {
  id: string;
  name: string;
  location: string;
  catalog_settings: PDVCatalogSettings | null;
}

export function usePDVCatalogSettings(organizationId?: string) {
  const queryClient = useQueryClient();

  const { data: pdvsWithSettings, isLoading, error } = useQuery({
    queryKey: ["pdv-catalog-settings", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      // Fetch PDVs
      const { data: pdvs, error: pdvsError } = await supabase
        .from("pdvs")
        .select("id, name, location")
        .eq("organization_id", organizationId)
        .eq("status", "active")
        .order("name");

      if (pdvsError) throw pdvsError;

      // Fetch catalog settings for these PDVs
      const pdvIds = pdvs.map(p => p.id);
      const { data: settings, error: settingsError } = await supabase
        .from("pdv_catalog_settings")
        .select("*")
        .in("pdv_id", pdvIds);

      if (settingsError) throw settingsError;

      // Merge PDVs with their settings
      const result: PDVWithCatalogSettings[] = pdvs.map(pdv => ({
        ...pdv,
        catalog_settings: settings?.find(s => s.pdv_id === pdv.id) || null,
      }));

      return result;
    },
    enabled: !!organizationId,
  });

  const upsertSettings = useMutation({
    mutationFn: async (data: {
      pdv_id: string;
      catalog_code?: string | null;
      catalog_qrcode_url?: string | null;
      catalog_modal_text?: string | null;
      is_enabled?: boolean;
    }) => {
      const { pdv_id, ...updateData } = data;

      // Check if settings exist
      const { data: existing } = await supabase
        .from("pdv_catalog_settings")
        .select("id")
        .eq("pdv_id", pdv_id)
        .single();

      if (existing) {
        // Update
        const { error } = await supabase
          .from("pdv_catalog_settings")
          .update(updateData)
          .eq("pdv_id", pdv_id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from("pdv_catalog_settings")
          .insert({ pdv_id, ...updateData });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdv-catalog-settings"] });
      toast({
        title: "Configuração salva!",
        description: "As configurações do catálogo foram atualizadas.",
      });
    },
    onError: (error) => {
      console.error("Error saving catalog settings:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    },
  });

  const uploadQrCode = async (pdvId: string, file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `pdv-${pdvId}-qrcode-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("catalog-images")
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("catalog-images")
      .getPublicUrl(fileName);

    return publicUrl;
  };

  return {
    pdvsWithSettings: pdvsWithSettings || [],
    isLoading,
    error,
    upsertSettings,
    uploadQrCode,
  };
}
