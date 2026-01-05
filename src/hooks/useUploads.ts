import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { UploadStatus, UploadType, uploadTypeLabels } from "@/lib/schemas/upload";
import { usePagination, PaginationControls } from "@/hooks/usePaginatedQuery";
import { parseUploadError, parseDeleteError } from "@/lib/errors/uploadErrors";

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

const PAGE_SIZE = 50;

export function useUploads() {
  const { user } = useAuth();
  const { profile, isAdmin } = useProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const pagination = usePagination(PAGE_SIZE);

  const uploadsQuery = useQuery({
    queryKey: ["uploads", profile?.organization_id, pagination.page, pagination.pageSize],
    queryFn: async (): Promise<UploadsQueryResult> => {
      const { from, to } = pagination.getRange();

      // First, get total count for pagination
      const { count, error: countError } = await supabase
        .from("uploads")
        .select("*", { count: "exact", head: true });

      if (countError) throw countError;

      // Get paginated uploads with PDV data
      const { data: uploadsData, error } = await supabase
        .from("uploads")
        .select(`
          *,
          pdv:pdvs(name, machine_id)
        `)
        .order("uploaded_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Get unique uploader IDs
      const uploaderIds = [...new Set(uploadsData.map((u) => u.uploaded_by))];

      // Fetch profiles separately
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", uploaderIds);

      const profilesMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      // Merge uploader data
      const uploads = uploadsData.map((upload) => ({
        ...upload,
        uploader: profilesMap.get(upload.uploaded_by) || { name: "Usuário" },
      })) as UploadListItem[];

      return {
        uploads,
        totalCount: count || 0,
      };
    },
    enabled: !!profile?.organization_id,
  });

  // Update pagination total count when data changes
  if (uploadsQuery.data && uploadsQuery.data.totalCount !== pagination.totalCount) {
    pagination.setTotalCount(uploadsQuery.data.totalCount);
  }

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
        }).then((response) => {
          queryClient.invalidateQueries({ queryKey: ["uploads"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          
          // Check for anomalies in the response
          const data = response.data;
          if (data?.hasAnomalies && data?.anomalyCount > 0) {
            // Import toast dynamically to show warning
            import("sonner").then(({ toast: sonnerToast }) => {
              sonnerToast.warning("Valores anormais detectados!", {
                description: `${data.anomalyCount} transação(ões) com valores acima de R$ 500. Verifique os dados importados.`,
                duration: 10000,
              });
            });
          }
        }).catch((err) => {
          console.error("Spreadsheet processing error:", err);
          queryClient.invalidateQueries({ queryKey: ["uploads"] });
        });
      }

      return {
        ...insertedUpload,
        uploader: uploaderProfile || { name: "Usuário" },
      } as UploadListItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["uploads"] });
      toast({
        title: "Upload iniciado",
        description: `Processando ${uploadTypeLabels[data.type].toLowerCase()} de ${data.pdv.name}`,
      });
    },
    onError: (error) => {
      const parsedError = parseUploadError(error);
      toast({
        title: parsedError.title,
        description: parsedError.description,
        variant: "destructive",
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
        const { error: stockDeleteError } = await supabase
          .from("stock_records")
          .delete()
          .eq("upload_id", uploadId);
        if (stockDeleteError) throw stockDeleteError;
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
      toast({
        title: "Upload excluído",
        description: `${data.fileName} foi removido com sucesso.`,
      });
    },
    onError: (error) => {
      const parsedError = parseDeleteError(error);
      toast({
        title: parsedError.title,
        description: parsedError.description,
        variant: "destructive",
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
