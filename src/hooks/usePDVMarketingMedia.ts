import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface MarketingMedia {
  id: string;
  pdv_id: string;
  media_type: "image" | "video";
  title: string;
  description: string | null;
  file_url: string;
  file_size: number | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface PDVWithMedia {
  id: string;
  name: string;
  location: string;
  media: MarketingMedia[];
}

export function usePDVMarketingMedia(organizationId?: string) {
  const queryClient = useQueryClient();

  const { data: pdvsWithMedia, isLoading, error } = useQuery({
    queryKey: ["pdv-marketing-media", organizationId],
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

      // Fetch media for these PDVs
      const pdvIds = pdvs.map(p => p.id);
      const { data: media, error: mediaError } = await supabase
        .from("pdv_marketing_media")
        .select("*")
        .in("pdv_id", pdvIds)
        .order("display_order");

      if (mediaError) throw mediaError;

      // Merge PDVs with their media
      const result: PDVWithMedia[] = pdvs.map(pdv => ({
        ...pdv,
        media: (media?.filter(m => m.pdv_id === pdv.id) || []) as MarketingMedia[],
      }));

      return result;
    },
    enabled: !!organizationId,
  });

  const addMedia = useMutation({
    mutationFn: async (data: {
      pdv_id: string;
      media_type: "image" | "video";
      title: string;
      description?: string | null;
      file_url: string;
      file_size?: number | null;
    }) => {
      // Get the max display_order for this PDV
      const { data: existing } = await supabase
        .from("pdv_marketing_media")
        .select("display_order")
        .eq("pdv_id", data.pdv_id)
        .order("display_order", { ascending: false })
        .limit(1);

      const nextOrder = existing && existing.length > 0 ? (existing[0].display_order || 0) + 1 : 0;

      const { error } = await supabase
        .from("pdv_marketing_media")
        .insert({
          ...data,
          display_order: nextOrder,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdv-marketing-media"] });
      toast({
        title: "Mídia adicionada!",
        description: "O arquivo foi adicionado com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Error adding media:", error);
      toast({
        title: "Erro ao adicionar",
        description: "Não foi possível adicionar a mídia.",
        variant: "destructive",
      });
    },
  });

  const updateMedia = useMutation({
    mutationFn: async (data: {
      id: string;
      title?: string;
      description?: string | null;
      is_active?: boolean;
    }) => {
      const { id, ...updateData } = data;
      const { error } = await supabase
        .from("pdv_marketing_media")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdv-marketing-media"] });
      toast({
        title: "Mídia atualizada!",
        description: "As alterações foram salvas.",
      });
    },
    onError: (error) => {
      console.error("Error updating media:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar a mídia.",
        variant: "destructive",
      });
    },
  });

  const deleteMedia = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("pdv_marketing_media")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdv-marketing-media"] });
      toast({
        title: "Mídia removida!",
        description: "O arquivo foi removido com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Error deleting media:", error);
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover a mídia.",
        variant: "destructive",
      });
    },
  });

  const uploadMediaFile = async (pdvId: string, file: File): Promise<{ url: string; size: number }> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `pdv-${pdvId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("marketing-media")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("marketing-media")
      .getPublicUrl(fileName);

    return { url: publicUrl, size: file.size };
  };

  return {
    pdvsWithMedia: pdvsWithMedia || [],
    isLoading,
    error,
    addMedia,
    updateMedia,
    deleteMedia,
    uploadMediaFile,
  };
}
