import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { UploadStatus, UploadType, uploadTypeLabels } from "@/lib/schemas/upload";
import { usePagination } from "@/hooks/usePaginatedQuery";
import { parseUploadError, parseDeleteError } from "@/lib/errors/uploadErrors";
import { ANOMALY_VALUE_THRESHOLD } from "@/lib/constants";

/** Interface para upload com dados de PDV e uploader (resultado de query com joins) */
export interface UploadListItem {
  id: string;
  pdv_id: string;
  pdv: { name: string; machine_id: string };
  type: UploadType;
  file_name: string;
  file_url: string | null;
  drive_url: string | null;
  status: UploadStatus;
  records_count: number | null;
  anomaly_count: number | null;
  period: string | null;
  uploaded_by: string;
  uploader: { name: string };
  uploaded_at: string;
  processed_at: string | null;
  error_message: string | null;
}

interface CreateUploadData {
  pdv_id: string;
  type: UploadType;
  period: string;
  file?: File;
  drive_url?: string;
}

interface UploadsQueryResult {
  uploads: UploadListItem[];
  totalCount: number;
}

/** Filtros aplicados server-side na query de uploads */
export interface UploadsFilters {
  pdvId?: string;
  type?: UploadType | "all";
  status?: UploadStatus | "all";
  search?: string;
}

const PAGE_SIZE = 50;

export function useUploads(filters: UploadsFilters = {}) {
  const { user } = useAuth();
  const { profile, isAdmin } = useProfile();
  const queryClient = useQueryClient();
  const pagination = usePagination(PAGE_SIZE);

  const { pdvId, type, status, search } = filters;

  // Correção: resetar para página 1 sempre que algum filtro mudar
  // Evita resultado vazio quando a página atual excede as páginas disponíveis do novo filtro
  useEffect(() => {
    pagination.setPage(1);
  }, [pdvId, type, status, search, pagination.setPage]);

  const uploadsQuery = useQuery({
    queryKey: ["uploads", profile?.organization_id, pagination.page, pagination.pageSize, pdvId, type, status, search],
    queryFn: async (): Promise<UploadsQueryResult> => {
      const { from, to } = pagination.getRange();
      const searchTerm = search?.trim();

      // Contagem total com filtros server-side (incluindo search para totalCount preciso)
      let countQuery = supabase
        .from("uploads")
        .select("*", { count: "exact", head: true });
      if (pdvId && pdvId !== "all") countQuery = countQuery.eq("pdv_id", pdvId);
      if (type && type !== "all") countQuery = countQuery.eq("type", type);
      if (status && status !== "all") countQuery = countQuery.eq("status", status);
      // Filtro de file_name e period server-side para que o totalCount reflita a busca
      if (searchTerm) {
        const term = `%${searchTerm}%`;
        countQuery = countQuery.or(`file_name.ilike.${term},period.ilike.${term}`);
      }
      const { count, error: countError } = await countQuery;
      if (countError) throw countError;

      // Query principal com filtros + paginação server-side
      let dataQuery = supabase
        .from("uploads")
        .select(`*, pdv:pdvs(name, machine_id)`)
        .order("uploaded_at", { ascending: false })
        .range(from, to);
      if (pdvId && pdvId !== "all") dataQuery = dataQuery.eq("pdv_id", pdvId);
      if (type && type !== "all") dataQuery = dataQuery.eq("type", type);
      if (status && status !== "all") dataQuery = dataQuery.eq("status", status);
      // file_name e period filtrados server-side; pdv.name é aplicado client-side abaixo
      if (searchTerm) {
        const term = `%${searchTerm}%`;
        dataQuery = dataQuery.or(`file_name.ilike.${term},period.ilike.${term}`);
      }

      const { data: uploadsData, error } = await dataQuery;
      if (error) throw error;

      // Busca perfis dos uploaders
      const uploaderIds = [...new Set(uploadsData.map((u) => u.uploaded_by))];
      const profilesData = uploaderIds.length > 0
        ? (await supabase.from("profiles").select("id, name").in("id", uploaderIds)).data
        : [];

      const profilesMap = new Map((profilesData || []).map((p) => [p.id, p]));

      let uploads = uploadsData.map((upload) => ({
        ...upload,
        pdv: upload.pdv || { name: "PDV removido", machine_id: "-" },
        uploader: profilesMap.get(upload.uploaded_by) || { name: "Usuário" },
      })) as UploadListItem[];

      return { uploads, totalCount: count || 0 };
    },
    enabled: !!profile?.organization_id,
  });

  // Update pagination total count when data changes
  useEffect(() => {
    if (uploadsQuery.data && uploadsQuery.data.totalCount !== pagination.totalCount) {
      pagination.setTotalCount(uploadsQuery.data.totalCount);
    }
  }, [uploadsQuery.data?.totalCount, pagination.totalCount, pagination.setTotalCount]);

  const createUpload = useMutation({
    mutationFn: async (data: CreateUploadData) => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      if (!profile?.organization_id) throw new Error("Organização não encontrada");

      let file_url: string | null = null;
      let file_name = "Link do Drive";

      // Upload file to storage if provided
      if (data.file) {
        file_name = data.file.name;
        const timestamp = Date.now();
        const filePath = `${profile.organization_id}/${user.id}/${timestamp}_${data.file.name}`;

        const { error: uploadError } = await supabase.storage
          .from("uploads")
          .upload(filePath, data.file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("uploads")
          .getPublicUrl(filePath);

        file_url = urlData.publicUrl;
      }

      // Insert upload record
      const { data: insertedUpload, error } = await supabase
        .from("uploads")
        .insert({
          pdv_id: data.pdv_id,
          type: data.type,
          period: data.period,
          file_name,
          file_url,
          drive_url: data.drive_url || null,
          status: "processing",
          uploaded_by: user.id,
        })
        .select(`
          *,
          pdv:pdvs(name, machine_id)
        `)
        .single();

      if (error) throw error;

      // Get uploader profile
      const { data: uploaderProfile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();

      // Trigger spreadsheet processing in background (don't await)
      if (file_url) {
        supabase.functions.invoke("process-spreadsheet", {
          body: { uploadId: insertedUpload.id },
        }).then(async (response) => {
          // Verificar erro da edge function (status 4xx/5xx retorna em response.error, não lança exceção)
          if (response.error) {
            console.error("Spreadsheet processing error:", response.error);
            const errorMsg = response.error.message || "Erro ao processar planilha";
            await supabase
              .from("uploads")
              .update({ 
                status: "error", 
                error_message: errorMsg 
              })
              .eq("id", insertedUpload.id);
            queryClient.invalidateQueries({ queryKey: ["uploads"] });
            toast.error("Erro no upload", {
              description: errorMsg,
              duration: 8000,
            });
            return;
          }

          queryClient.invalidateQueries({ queryKey: ["uploads"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-data-range"] });
          
          // Check for anomalies in the response
          const data = response.data;
          if (data?.hasAnomalies && data?.anomalyCount > 0) {
            toast.warning("Valores anormais detectados!", {
              description: `${data.anomalyCount} transação(ões) com valores acima de R$ ${ANOMALY_VALUE_THRESHOLD.toLocaleString("pt-BR")}. Verifique os dados importados.`,
              duration: 10000,
            });
          }
        }).catch(async (err) => {
          console.error("Spreadsheet processing error:", err);
          const errorMsg = err?.message || "Erro ao processar planilha";
          await supabase
            .from("uploads")
            .update({ 
              status: "error", 
              error_message: errorMsg 
            })
            .eq("id", insertedUpload.id);
          queryClient.invalidateQueries({ queryKey: ["uploads"] });
          toast.error("Erro no upload", {
            description: errorMsg,
            duration: 8000,
          });
        });
      }

      return {
        ...insertedUpload,
        uploader: uploaderProfile || { name: "Usuário" },
      } as UploadListItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["uploads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data-range"] });
      toast.success("Upload iniciado", {
        description: `Processando ${uploadTypeLabels[data.type].toLowerCase()} de ${data.pdv.name}`,
      });
    },
    onError: (error) => {
      console.error("[createUpload] Error object:", error, typeof error);
      const parsedError = parseUploadError(error);
      toast.error(parsedError.title, {
        description: parsedError.description,
      });
    },
  });

  const deleteUpload = useMutation({
    mutationFn: async (uploadId: string) => {
      if (!isAdmin) throw new Error("Apenas administradores podem excluir uploads");

      // Get the upload to find the file_url
      const { data: upload, error: fetchError } = await supabase
        .from("uploads")
        .select("file_url, file_name, type")
        .eq("id", uploadId)
        .single();

      if (fetchError) throw fetchError;

      // Delete related records first (sales_records or stock_records)
      if (upload.type === "sales") {
        const { error: salesDeleteError } = await supabase
          .from("sales_records")
          .delete()
          .eq("upload_id", uploadId);
        if (salesDeleteError) throw salesDeleteError;
      } else {
        // Deleta stock_records do upload
        const { error: stockDeleteError } = await supabase
          .from("stock_records")
          .delete()
          .eq("upload_id", uploadId);
        if (stockDeleteError) throw stockDeleteError;

        // Corrigido: também limpa stock_history para evitar snapshots órfãos
        // que corrompem os gráficos de histórico de estoque
        const { error: historyDeleteError } = await supabase
          .from("stock_history")
          .delete()
          .eq("upload_id", uploadId);
        if (historyDeleteError) {
          console.warn("Failed to delete stock_history entries:", historyDeleteError);
          // Não falha a operação — stock_history é derivado e pode ser regenerado
        }
      }

      // Delete file from storage if exists
      if (upload.file_url) {
        const urlParts = upload.file_url.split("/uploads/");
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          const { error: storageError } = await supabase.storage
            .from("uploads")
            .remove([filePath]);
          // Log but don't fail the operation if storage deletion fails
          if (storageError) {
            console.warn("Failed to delete file from storage:", storageError);
          }
        }
      }

      // Delete upload record
      const { error } = await supabase
        .from("uploads")
        .delete()
        .eq("id", uploadId);

      if (error) throw error;
      return { fileName: upload.file_name };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["uploads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data-range"] });
      toast.success("Upload excluído", {
        description: `${data.fileName} foi removido com sucesso.`,
      });
    },
    onError: (error) => {
      const parsedError = parseDeleteError(error);
      toast.error(parsedError.title, {
        description: parsedError.description,
      });
    },
  });

  return {
    uploads: uploadsQuery.data?.uploads || [],
    totalCount: uploadsQuery.data?.totalCount || 0,
    isLoading: uploadsQuery.isLoading,
    error: uploadsQuery.error,
    createUpload,
    deleteUpload,
    pagination,
  };
}
