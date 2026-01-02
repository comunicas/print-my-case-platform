import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface PublicOrganization {
  id: string;
  name: string;
  public_slug: string;
}

export interface PublicStockItem {
  product_name: string;
  status: "available" | "low" | "unavailable";
}

export interface ProductRequestData {
  organization_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  requested_model: string;
  message?: string;
}

export function usePublicStock(orgSlug: string | undefined) {
  const queryClient = useQueryClient();

  const organizationQuery = useQuery({
    queryKey: ["public-organization", orgSlug],
    queryFn: async () => {
      if (!orgSlug) return null;
      
      const { data, error } = await supabase
        .rpc("get_public_organization", { p_slug: orgSlug });
      
      if (error) throw error;
      
      if (!data || data.length === 0) return null;
      
      return data[0] as PublicOrganization;
    },
    enabled: !!orgSlug,
  });

  const stockQuery = useQuery({
    queryKey: ["public-stock", organizationQuery.data?.id],
    queryFn: async () => {
      const orgId = organizationQuery.data?.id;
      if (!orgId) return [];
      
      const { data, error } = await supabase
        .rpc("get_public_stock", { p_org_id: orgId });
      
      if (error) throw error;
      
      // Remove quantity from response, only return product_name and status
      return ((data as { product_name: string; status: string; total_quantity: number }[]) || []).map((item) => ({
        product_name: item.product_name,
        status: item.status as "available" | "low" | "unavailable",
      })) as PublicStockItem[];
    },
    enabled: !!organizationQuery.data?.id,
  });

  const submitRequestMutation = useMutation({
    mutationFn: async (data: ProductRequestData) => {
      const { error } = await supabase
        .from("product_requests")
        .insert({
          organization_id: data.organization_id,
          customer_name: data.customer_name,
          customer_phone: data.customer_phone,
          customer_email: data.customer_email || null,
          requested_model: data.requested_model,
          message: data.message || null,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Pedido enviado!",
        description: "Entraremos em contato quando o modelo estiver disponível.",
      });
      queryClient.invalidateQueries({ queryKey: ["public-stock"] });
    },
    onError: () => {
      toast({
        title: "Erro ao enviar pedido",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  return {
    organization: organizationQuery.data,
    isLoadingOrganization: organizationQuery.isLoading,
    organizationError: organizationQuery.error,
    stock: stockQuery.data || [],
    isLoadingStock: stockQuery.isLoading,
    submitRequest: submitRequestMutation.mutate,
    isSubmitting: submitRequestMutation.isPending,
  };
}
