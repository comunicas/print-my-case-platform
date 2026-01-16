import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserAllowedPDVs } from "./useUserAllowedPDVs";
import { useOrganization } from "./useOrganization";

export interface VitrineMedia {
  id: string;
  pdv_id: string;
  pdv_name: string;
  pdv_location: string;
  title: string;
  description: string | null;
  file_url: string;
  file_size: number | null;
  media_type: "image" | "video" | "audio";
  display_order: number | null;
}

/**
 * Hook para buscar mídias ativas dos PDVs que o usuário pode acessar.
 * Usado na página Vitrine para exibir mídias disponíveis para download.
 */
export function useVitrineMedia(selectedPdvId?: string) {
  const { organization, isLoading: orgLoading } = useOrganization();
  const { allowedPdvIds, isLoading: pdvsLoading } = useUserAllowedPDVs();

  const query = useQuery({
    queryKey: ["vitrine-media", organization?.id, allowedPdvIds, selectedPdvId],
    queryFn: async (): Promise<VitrineMedia[]> => {
      if (!organization?.id) return [];

      // Primeiro, buscamos os PDVs da organização
      let pdvsQuery = supabase
        .from("pdvs")
        .select("id, name, location")
        .eq("organization_id", organization.id)
        .eq("status", "active");

      // Se o usuário tem restrições de PDV, aplicar filtro
      if (allowedPdvIds !== null && allowedPdvIds.length > 0) {
        pdvsQuery = pdvsQuery.in("id", allowedPdvIds);
      }

      // Se um PDV específico foi selecionado
      if (selectedPdvId && selectedPdvId !== "all") {
        pdvsQuery = pdvsQuery.eq("id", selectedPdvId);
      }

      const { data: pdvs, error: pdvsError } = await pdvsQuery;
      if (pdvsError) throw pdvsError;
      if (!pdvs || pdvs.length === 0) return [];

      const pdvIds = pdvs.map((p) => p.id);
      const pdvMap = new Map(pdvs.map((p) => [p.id, p]));

      // Buscar mídias ativas dos PDVs permitidos
      const { data: media, error: mediaError } = await supabase
        .from("pdv_marketing_media")
        .select("id, pdv_id, title, description, file_url, file_size, media_type, display_order")
        .in("pdv_id", pdvIds)
        .eq("is_active", true)
        .order("display_order", { ascending: true, nullsFirst: false });

      if (mediaError) throw mediaError;

      // Combinar dados de mídia com dados do PDV
      return (media || []).map((m) => {
        const pdv = pdvMap.get(m.pdv_id);
        return {
          id: m.id,
          pdv_id: m.pdv_id,
          pdv_name: pdv?.name || "",
          pdv_location: pdv?.location || "",
          title: m.title,
          description: m.description,
          file_url: m.file_url,
          file_size: m.file_size,
          media_type: m.media_type as "image" | "video" | "audio",
          display_order: m.display_order,
        };
      });
    },
    enabled: !!organization?.id && !orgLoading && !pdvsLoading,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  return {
    media: query.data ?? [],
    isLoading: orgLoading || pdvsLoading || query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
