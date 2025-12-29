import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePreferences } from "@/hooks/usePreferences";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  Search,
  Trash2,
  FileSpreadsheet,
  Package,
  BarChart3,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ExternalLink,
  Eye,
} from "lucide-react";
import { UploadDialog } from "@/components/upload/UploadDialog";
import {
  UploadType,
  UploadStatus,
  uploadTypeLabels,
  uploadStatusLabels,
} from "@/lib/schemas/upload";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useUploads, UploadListItem } from "@/hooks/useUploads";
import { usePDVs } from "@/hooks/usePDVs";
import { useProfile } from "@/hooks/useProfile";
import { PDVFilter } from "@/components/ui/PDVFilter";

export default function Uploads() {
  const navigate = useNavigate();
  const { uploads, isLoading, createUpload, deleteUpload } = useUploads();
  const { pdvs, isLoading: pdvsLoading } = usePDVs();
  const { isAdmin } = useProfile();
  const { preferences, isLoading: isLoadingPreferences } = usePreferences();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterPdv, setFilterPdv] = useState<string>("all");
  const [hasInitializedPrefs, setHasInitializedPrefs] = useState(false);
  const [pdvWasAutoApplied, setPdvWasAutoApplied] = useState(false);

  // Apply default_pdv preference on first load
  useEffect(() => {
    if (preferences && !hasInitializedPrefs && !isLoadingPreferences && !pdvsLoading) {
      if (preferences.default_pdv) {
        // Validate that the PDV exists in the list
        const pdvExists = pdvs.some(p => p.id === preferences.default_pdv);
        if (pdvExists) {
          setFilterPdv(preferences.default_pdv);
          setPdvWasAutoApplied(true);
        }
      }
      setHasInitializedPrefs(true);
    }
  }, [preferences, hasInitializedPrefs, isLoadingPreferences, pdvs, pdvsLoading]);

  const handlePdvChange = (value: string) => {
    setFilterPdv(value);
    setPdvWasAutoApplied(false);
  };

  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingUpload, setDeletingUpload] = useState<UploadListItem | null>(null);

  const filteredUploads = uploads.filter((upload) => {
    // Proteção contra dados incompletos
    if (!upload.pdv?.name) return false;
    
    const matchesSearch =
      upload.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      upload.pdv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      upload.period?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPdv = filterPdv === "all" || upload.pdv_id === filterPdv;
    const matchesType = filterType === "all" || upload.type === filterType;
    const matchesStatus = filterStatus === "all" || upload.status === filterStatus;

    return matchesSearch && matchesPdv && matchesType && matchesStatus;
  });

  const handleUploadSubmit = (data: {
    pdvId: string;
    type: UploadType;
    period: string;
    file?: File;
    driveUrl?: string;
  }) => {
    createUpload.mutate(
      {
        pdv_id: data.pdvId,
        type: data.type,
        period: data.period,
        file: data.file,
        drive_url: data.driveUrl,
      },
      {
        onSuccess: () => setIsUploadDialogOpen(false),
      }
    );
  };

  const handleOpenDelete = (upload: UploadListItem) => {
    setDeletingUpload(upload);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteUpload = () => {
    if (!deletingUpload) return;

    deleteUpload.mutate(deletingUpload.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        setDeletingUpload(null);
      },
    });
  };

  const getStatusIcon = (status: UploadStatus) => {
    switch (status) {
      case "ready":
        return <CheckCircle2 className="h-4 w-4" />;
      case "processing":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "error":
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusBadgeClass = (status: UploadStatus) => {
    switch (status) {
      case "ready":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "processing":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "error":
        return "bg-destructive/10 text-destructive";
    }
  };

  const getTypeBadgeClass = (type: UploadType) => {
    switch (type) {
      case "sales":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "stock":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
    }
  };

  const getTypeIcon = (type: UploadType) => {
    switch (type) {
      case "sales":
        return <BarChart3 className="h-5 w-5" />;
      case "stock":
        return <Package className="h-5 w-5" />;
    }
  };

  if (isLoading || pdvsLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  const activePdvs = pdvs.filter((p) => p.status === "active");

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">
              Uploads
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Gerencie planilhas de vendas e estoque
            </p>
          </div>

          <Button 
            className="w-full sm:w-auto" 
            onClick={() => setIsUploadDialogOpen(true)}
            disabled={activePdvs.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Upload
          </Button>
        </div>

        {/* Filters Section */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por arquivo, PDV ou período..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <PDVFilter
              value={filterPdv}
              onChange={handlePdvChange}
              pdvs={pdvs}
              showAutoAppliedBadge={pdvWasAutoApplied}
              triggerClassName="w-[160px]"
            />

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="sales">Vendas</SelectItem>
                <SelectItem value="stock">Estoque</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="ready">Processado</SelectItem>
                <SelectItem value="processing">Processando</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Uploads Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {filteredUploads.map((upload) => (
            <Card key={upload.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      upload.type === "sales"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                    }`}
                  >
                    {getTypeIcon(upload.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm truncate">
                          {upload.pdv.name}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {upload.period}
                        </p>
                      </div>
                      <Badge className={`flex-shrink-0 ${getTypeBadgeClass(upload.type)}`}>
                        {uploadTypeLabels[upload.type]}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <FileSpreadsheet className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs text-muted-foreground truncate">
                        {upload.file_name}
                      </span>
                      {upload.drive_url && (
                        <a
                          href={upload.drive_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              className={`flex items-center gap-1 cursor-default ${getStatusBadgeClass(
                                upload.status
                              )}`}
                            >
                              {getStatusIcon(upload.status)}
                              {uploadStatusLabels[upload.status]}
                              {upload.status === "ready" && upload.records_count && (
                                <span className="ml-1">({upload.records_count})</span>
                              )}
                            </Badge>
                          </TooltipTrigger>
                          {upload.status === "error" && upload.error_message && (
                            <TooltipContent
                              side="top"
                              className="max-w-xs"
                            >
                              <p className="text-xs">{upload.error_message}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(upload.uploaded_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>

                      <div className="flex gap-1">
                        {upload.status === "ready" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => navigate(`/uploads/${upload.id}`)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleOpenDelete(upload)}
                            disabled={deleteUpload.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredUploads.length === 0 && (
          <div className="text-center py-12">
            <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground">
              Nenhum upload encontrado
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery || filterPdv !== "all" || filterType !== "all" || filterStatus !== "all"
                ? "Tente ajustar seus filtros."
                : "Comece enviando sua primeira planilha."}
            </p>
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <UploadDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        pdvOptions={activePdvs.map((p) => ({
          id: p.id,
          name: p.name,
          machine_id: p.machine_id,
        }))}
        onSubmit={handleUploadSubmit}
        isSubmitting={createUpload.isPending}
      />

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o upload "{deletingUpload?.file_name}" de{" "}
              {deletingUpload?.pdv.name}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteUpload.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUpload}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteUpload.isPending}
            >
              {deleteUpload.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
