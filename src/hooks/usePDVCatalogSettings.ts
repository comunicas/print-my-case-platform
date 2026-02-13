import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CUSTOM_DOMAIN } from "@/lib/constants";

export interface PDVCatalogSettings {
  id: string;
  pdv_id: string;
  catalog_code: string | null;
  catalog_qrcode_url: string | null;
  catalog_modal_text: string | null;
  is_enabled: boolean;
  public_slug: string | null;
  is_public_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShortLink {
  id: string;
  pdv_id: string;
  short_code: string;
  target_url: string;
  click_count: number;
}

interface PDVWithCatalogSettings {
  id: string;
  name: string;
  location: string;
  catalog_settings: PDVCatalogSettings | null;
  short_link: ShortLink | null;
}

function generateShortCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function usePDVCatalogSettings(organizationId?: string) {
  const queryClient = useQueryClient();

  const { data: pdvsWithSettings, isLoading, error } = useQuery({
    queryKey: ["pdv-catalog-settings", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      const { data: pdvs, error: pdvsError } = await supabase
        .from("pdvs")
        .select("id, name, location")
        .eq("organization_id", organizationId)
        .eq("status", "active")
        .order("name");

      if (pdvsError) throw pdvsError;

      const pdvIds = pdvs.map(p => p.id);
      
      const [settingsRes, shortLinksRes] = await Promise.all([
        supabase.from("pdv_catalog_settings").select("*").in("pdv_id", pdvIds),
        supabase.from("catalog_short_links").select("*").in("pdv_id", pdvIds),
      ]);

      if (settingsRes.error) throw settingsRes.error;
      if (shortLinksRes.error) throw shortLinksRes.error;

      const result: PDVWithCatalogSettings[] = pdvs.map(pdv => ({
        ...pdv,
        catalog_settings: settingsRes.data?.find(s => s.pdv_id === pdv.id) as PDVCatalogSettings | undefined || null,
        short_link: shortLinksRes.data?.find(s => s.pdv_id === pdv.id) as ShortLink | undefined || null,
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
      public_slug?: string | null;
      is_public_enabled?: boolean;
    }) => {
      const { pdv_id, ...updateData } = data;

      const { data: existing } = await supabase
        .from("pdv_catalog_settings")
        .select("id")
        .eq("pdv_id", pdv_id)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("pdv_catalog_settings")
          .update(updateData)
          .eq("pdv_id", pdv_id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("pdv_catalog_settings")
          .insert({ pdv_id, ...updateData });
        if (error) throw error;
      }

      // Create short link if enabling public and slug exists
      if (data.is_public_enabled && data.public_slug) {
        const targetUrl = `${CUSTOM_DOMAIN}/catalogo/${data.public_slug}`;
        
        const { data: existingLink } = await supabase
          .from("catalog_short_links")
          .select("id")
          .eq("pdv_id", pdv_id)
          .single();

        if (existingLink) {
          await supabase
            .from("catalog_short_links")
            .update({ target_url: targetUrl })
            .eq("pdv_id", pdv_id);
        } else {
          let shortCode = generateShortCode();
          let attempts = 0;
          while (attempts < 5) {
            const { error: insertError } = await supabase
              .from("catalog_short_links")
              .insert({ pdv_id, short_code: shortCode, target_url: targetUrl });
            if (!insertError) break;
            if (insertError.message?.includes("unique")) {
              shortCode = generateShortCode();
              attempts++;
            } else {
              throw insertError;
            }
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdv-catalog-settings"] });
      toast.success("Configuração salva!", {
        description: "As configurações do catálogo foram atualizadas.",
      });
    },
    onError: (error) => {
      console.error("Error saving catalog settings:", error);
      const msg = error.message?.includes("unique")
        ? "Este slug já está em uso. Escolha outro."
        : "Não foi possível salvar as configurações.";
      toast.error("Erro ao salvar", { description: msg });
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

  // Auto-create short links for existing enabled catalogs that don't have one
  const autoCreatingRef = useRef(false);
  useEffect(() => {
    const list = pdvsWithSettings || [];
    if (list.length === 0 || autoCreatingRef.current) return;

    const needShortLink = list.filter(
      (pdv) =>
        pdv.catalog_settings?.is_public_enabled &&
        pdv.catalog_settings?.public_slug &&
        !pdv.short_link
    );

    if (needShortLink.length === 0) return;
    autoCreatingRef.current = true;

    Promise.all(
      needShortLink.map(async (pdv) => {
        const targetUrl = `${CUSTOM_DOMAIN}/catalogo/${pdv.catalog_settings!.public_slug}`;
        let shortCode = generateShortCode();
        let attempts = 0;
        while (attempts < 5) {
          const { error: insertError } = await supabase
            .from("catalog_short_links")
            .insert({ pdv_id: pdv.id, short_code: shortCode, target_url: targetUrl });
          if (!insertError) break;
          if (insertError.message?.includes("unique")) {
            shortCode = generateShortCode();
            attempts++;
          } else {
            console.error("Error creating short link:", insertError);
            break;
          }
        }
      })
    ).then(() => {
      queryClient.invalidateQueries({ queryKey: ["pdv-catalog-settings"] });
      autoCreatingRef.current = false;
    });
  }, [pdvsWithSettings, queryClient]);

  return {
    pdvsWithSettings: pdvsWithSettings || [],
    isLoading,
    error,
    upsertSettings,
    uploadQrCode,
  };
}
