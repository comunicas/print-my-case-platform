import { useState } from "react";
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
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UploadDialog } from "@/components/upload/UploadDialog";
import {
  Upload,
  UploadType,
  UploadStatus,
  uploadTypeLabels,
  uploadStatusLabels,
} from "@/lib/schemas/upload";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const mockPdvs = [
  { id: "1", name: "Shopping Ibirapuera", deviceId: "1001543" },
  { id: "2", name: "Shopping Morumbi", deviceId: "1001544" },
  { id: "3", name: "Shopping Center Norte", deviceId: "1001545" },
  { id: "4", name: "Shopping Eldorado", deviceId: "1001546" },
];

const mockUploads: Upload[] = [
  {
    id: "1",
    pdvId: "1",
    pdvName: "Shopping Ibirapuera",
    deviceId: "1001543",
    type: "sales",
    fileName: "REVENUE.xlsx",
    status: "ready",
    recordsCount: 87,
    period: "Dez 2025",
    uploadedBy: "João Silva",
    uploadedAt: new Date("2025-12-09T10:30:00"),
    processedAt: new Date("2025-12-09T10:32:00"),
  },
  {
    id: "2",
    pdvId: "1",
    pdvName: "Shopping Ibirapuera",
    deviceId: "1001543",
    type: "stock",
    fileName: "REPORT-SLOT.xlsx",
    status: "ready",
    recordsCount: 86,
    period: "Dez 2025",
    uploadedBy: "Maria Santos",
    uploadedAt: new Date("2025-12-10T09:15:00"),
    processedAt: new Date("2025-12-10T09:17:00"),
  },
  {
    id: "3",
    pdvId: "2",
    pdvName: "Shopping Morumbi",
    deviceId: "1001544",
    type: "sales",
    fileName: "REVENUE_NOV.xlsx",
    status: "processing",
    period: "Nov 2025",
    uploadedBy: "Carlos Oliveira",
    uploadedAt: new Date("2025-12-10T14:00:00"),
  },
  {
    id: "4",
    pdvId: "3",
    pdvName: "Shopping Center Norte",
    deviceId: "1001545",
    type: "sales",
    fileName: "Link do Drive",
    driveUrl: "https://drive.google.com/spreadsheets/d/abc123",
    status: "error",
    period: "Nov 2025",
    uploadedBy: "Ana Costa",
    uploadedAt: new Date("2025-12-08T16:45:00"),
    errorMessage: "Formato de arquivo inválido. Verifique se a planilha possui as colunas obrigatórias.",
  },
  {
    id: "5",
    pdvId: "4",
    pdvName: "Shopping Eldorado",
    deviceId: "1001546",
    type: "stock",
    fileName: "REPORT-SLOT_DEZ.xlsx",
    status: "ready",
    recordsCount: 120,
    period: "Dez 2025",
    uploadedBy: "Pedro Lima",
    uploadedAt: new Date("2025-12-07T11:20:00"),
    processedAt: new Date("2025-12-07T11:23:00"),
  },
  {
    id: "6",
    pdvId: "2",
    pdvName: "Shopping Morumbi",
    deviceId: "1001544",
    type: "stock",
    fileName: "REPORT-SLOT.xlsx",
    status: "ready",
    recordsCount: 95,
    period: "Nov 2025",
    uploadedBy: "Fernanda Souza",
    uploadedAt: new Date("2025-12-05T08:00:00"),
    processedAt: new Date("2025-12-05T08:02:00"),
  },
];

export default function Uploads() {
  const [uploads, setUploads] = useState<Upload[]>(mockUploads);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPdv, setFilterPdv] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingUpload, setDeletingUpload] = useState<Upload | null>(null);
  const { toast } = useToast();

  const filteredUploads = uploads.filter((upload) => {
    const matchesSearch =
      upload.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      upload.pdvName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      upload.period?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPdv = filterPdv === "all" || upload.pdvId === filterPdv;
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
    const pdv = mockPdvs.find((p) => p.id === data.pdvId);
    if (!pdv) return;

    const newUpload: Upload = {
      id: String(Date.now()),
      pdvId: data.pdvId,
      pdvName: pdv.name,
      deviceId: pdv.deviceId,
      type: data.type,
      fileName: data.file?.name || "Link do Drive",
      driveUrl: data.driveUrl,
      status: "processing",
      period: data.period,
      uploadedBy: "Usuário Atual",
      uploadedAt: new Date(),
    };

    setUploads([newUpload, ...uploads]);
    toast({
      title: "Upload iniciado",
      description: `Processando ${uploadTypeLabels[data.type].toLowerCase()} de ${pdv.name}`,
    });

    // Simulate processing completion after 3 seconds
    setTimeout(() => {
      setUploads((prev) =>
        prev.map((u) =>
          u.id === newUpload.id
            ? {
                ...u,
                status: "ready" as UploadStatus,
                recordsCount: Math.floor(Math.random() * 100) + 50,
                processedAt: new Date(),
              }
            : u
        )
      );
      toast({
        title: "Upload concluído",
        description: `${uploadTypeLabels[data.type]} processado com sucesso.`,
      });
    }, 3000);
  };

  const handleOpenDelete = (upload: Upload) => {
    setDeletingUpload(upload);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteUpload = () => {
    if (!deletingUpload) return;

    setUploads(uploads.filter((u) => u.id !== deletingUpload.id));
    setIsDeleteDialogOpen(false);
    toast({
      title: "Upload excluído",
      description: `${deletingUpload.fileName} foi removido.`,
    });
    setDeletingUpload(null);
  };

  const handleReprocess = (upload: Upload) => {
    setUploads((prev) =>
      prev.map((u) =>
        u.id === upload.id
          ? { ...u, status: "processing" as UploadStatus, errorMessage: undefined }
          : u
      )
    );
    toast({
      title: "Reprocessando",
      description: `${upload.fileName} será processado novamente.`,
    });

    setTimeout(() => {
      setUploads((prev) =>
        prev.map((u) =>
          u.id === upload.id
            ? {
                ...u,
                status: "ready" as UploadStatus,
                recordsCount: Math.floor(Math.random() * 100) + 50,
                processedAt: new Date(),
              }
            : u
        )
      );
    }, 3000);
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

          <Button className="w-full sm:w-auto" onClick={() => setIsUploadDialogOpen(true)}>
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
            <Select value={filterPdv} onValueChange={setFilterPdv}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="PDV" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os PDVs</SelectItem>
                {mockPdvs.map((pdv) => (
                  <SelectItem key={pdv.id} value={pdv.id}>
                    {pdv.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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
                          {upload.pdvName}
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
                        {upload.fileName}
                      </span>
                      {upload.driveUrl && (
                        <a
                          href={upload.driveUrl}
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
                              {upload.status === "ready" && upload.recordsCount && (
                                <span className="ml-1">({upload.recordsCount})</span>
                              )}
                            </Badge>
                          </TooltipTrigger>
                          {upload.status === "error" && upload.errorMessage && (
                            <TooltipContent
                              side="top"
                              className="max-w-xs"
                            >
                              <p className="text-xs">{upload.errorMessage}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(upload.uploadedAt, {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>

                      <div className="flex gap-1">
                        {upload.status === "error" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleReprocess(upload)}
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleOpenDelete(upload)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
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
        pdvOptions={mockPdvs}
        onSubmit={handleUploadSubmit}
      />

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o upload "{deletingUpload?.fileName}" de{" "}
              {deletingUpload?.pdvName}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUpload}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
