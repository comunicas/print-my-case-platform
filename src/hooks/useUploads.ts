import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { uploadTypeLabels } from "@/lib/schemas/upload";

export interface UploadWithRelations {
  id: string;
  pdv_id: string;
  pdv: { name: string; machine_id: string };
  type: "sales" | "stock";
  file_name: string;
  file_url: string | null;
  drive_url: string | null;
  status: "processing" | "ready" | "error";
  records_count: number | null;
  period: string | null;
  uploaded_by: string;
  uploader: { name: string };
  uploaded_at: string;
  processed_at: string | null;
  error_message: string | null;
}

interface CreateUploadData {
  pdv_id: string;
  type: "sales" | "stock";
  period: string;
  file?: File;
  drive_url?: string;
}

export function useUploads() {
  const { user } = useAuth();
  const { profile, isAdmin } = useProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadsQuery = useQuery({
    queryKey: ["uploads", profile?.organization_id],
    queryFn: async () => {
      // First get uploads with PDV data
      const { data: uploadsData, error } = await supabase
        .from("uploads")
        .select(`
          *,
          pdv:pdvs(name, machine_id)
        `)
        .order("uploaded_at", { ascending: false });

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
      return uploadsData.map((upload) => ({
        ...upload,
        uploader: profilesMap.get(upload.uploaded_by) || { name: "Usuário" },
      })) as UploadWithRelations[];
    },
    enabled: !!profile?.organization_id,
  });

  const createUpload = useMutation({
    mutationFn: async (data: CreateUploadData) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      let file_url: string | null = null;
      let file_name = "Link do Drive";

      // Upload file to storage if provided
      if (data.file) {
        file_name = data.file.name;
        const timestamp = Date.now();
        const filePath = `${user.id}/${timestamp}_${data.file.name}`;

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

      return {
        ...insertedUpload,
        uploader: uploaderProfile || { name: "Usuário" },
      } as UploadWithRelations;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["uploads"] });
      toast({
        title: "Upload iniciado",
        description: `Processando ${uploadTypeLabels[data.type].toLowerCase()} de ${data.pdv.name}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro no upload",
        description: error.message,
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
        await supabase.from("sales_records").delete().eq("upload_id", uploadId);
      } else {
        await supabase.from("stock_records").delete().eq("upload_id", uploadId);
      }

      // Delete file from storage if exists
      if (upload.file_url) {
        // Extract file path from URL
        const urlParts = upload.file_url.split("/uploads/");
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          await supabase.storage.from("uploads").remove([filePath]);
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
        description: `${data.fileName} foi removido.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    uploads: uploadsQuery.data || [],
    isLoading: uploadsQuery.isLoading,
    error: uploadsQuery.error,
    createUpload,
    deleteUpload,
  };
}
