import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileSpreadsheet, Link, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { UploadType } from "@/lib/schemas/upload";

interface PDVOption {
  id: string;
  name: string;
  deviceId: string;
}

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdvOptions: PDVOption[];
  onSubmit: (data: {
    pdvId: string;
    type: UploadType;
    period: string;
    file?: File;
    driveUrl?: string;
  }) => void;
}

const periods = [
  "Dez 2025",
  "Nov 2025",
  "Out 2025",
  "Set 2025",
  "Ago 2025",
  "Jul 2025",
  "Jun 2025",
  "Mai 2025",
  "Abr 2025",
  "Mar 2025",
  "Fev 2025",
  "Jan 2025",
];

export function UploadDialog({
  open,
  onOpenChange,
  pdvOptions,
  onSubmit,
}: UploadDialogProps) {
  const [pdvId, setPdvId] = useState("");
  const [type, setType] = useState<UploadType>("sales");
  const [period, setPeriod] = useState("");
  const [source, setSource] = useState<"file" | "drive">("file");
  const [file, setFile] = useState<File | null>(null);
  const [driveUrl, setDriveUrl] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setPdvId("");
    setType("sales");
    setPeriod("");
    setSource("file");
    setFile(null);
    setDriveUrl("");
    setErrors({});
    setIsDragOver(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!pdvId) newErrors.pdvId = "Selecione um PDV";
    if (!period) newErrors.period = "Selecione o período";
    if (source === "file" && !file) newErrors.file = "Selecione um arquivo";
    if (source === "drive" && !driveUrl) newErrors.driveUrl = "Insira um link do Drive";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    onSubmit({
      pdvId,
      type,
      period,
      file: source === "file" ? file! : undefined,
      driveUrl: source === "drive" ? driveUrl : undefined,
    });

    handleClose(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && isValidFileType(droppedFile)) {
      setFile(droppedFile);
      setErrors((prev) => ({ ...prev, file: "" }));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && isValidFileType(selectedFile)) {
      setFile(selectedFile);
      setErrors((prev) => ({ ...prev, file: "" }));
    }
  };

  const isValidFileType = (file: File): boolean => {
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    return validTypes.includes(file.type) || file.name.endsWith(".xlsx") || file.name.endsWith(".csv");
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Novo Upload
          </DialogTitle>
          <DialogDescription>
            Envie planilhas de vendas ou estoque para um PDV.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* PDV Selection */}
          <div className="space-y-2">
            <Label htmlFor="pdv">PDV *</Label>
            <Select value={pdvId} onValueChange={(value) => {
              setPdvId(value);
              setErrors((prev) => ({ ...prev, pdvId: "" }));
            }}>
              <SelectTrigger className={cn(errors.pdvId && "border-destructive")}>
                <SelectValue placeholder="Selecione um PDV" />
              </SelectTrigger>
              <SelectContent>
                {pdvOptions.map((pdv) => (
                  <SelectItem key={pdv.id} value={pdv.id}>
                    {pdv.name} ({pdv.deviceId})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.pdvId && (
              <p className="text-sm text-destructive">{errors.pdvId}</p>
            )}
          </div>

          {/* Data Type */}
          <div className="space-y-2">
            <Label>Tipo de Dados *</Label>
            <RadioGroup
              value={type}
              onValueChange={(value) => setType(value as UploadType)}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sales" id="sales" />
                <Label htmlFor="sales" className="font-normal cursor-pointer">
                  Vendas
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="stock" id="stock" />
                <Label htmlFor="stock" className="font-normal cursor-pointer">
                  Estoque
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Period */}
          <div className="space-y-2">
            <Label htmlFor="period">Período de Referência *</Label>
            <Select value={period} onValueChange={(value) => {
              setPeriod(value);
              setErrors((prev) => ({ ...prev, period: "" }));
            }}>
              <SelectTrigger className={cn(errors.period && "border-destructive")}>
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                {periods.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.period && (
              <p className="text-sm text-destructive">{errors.period}</p>
            )}
          </div>

          {/* Source Tabs */}
          <div className="space-y-2">
            <Label>Fonte dos Dados</Label>
            <Tabs value={source} onValueChange={(value) => setSource(value as "file" | "drive")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file" className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Arquivo
                </TabsTrigger>
                <TabsTrigger value="drive" className="flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  Link do Drive
                </TabsTrigger>
              </TabsList>

              <TabsContent value="file" className="mt-3">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                    isDragOver
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-primary/50",
                    errors.file && "border-destructive"
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {file ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileSpreadsheet className="h-8 w-8 text-primary" />
                      <div className="text-left">
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 ml-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile();
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">
                        Arraste sua planilha aqui
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        ou clique para selecionar (.xlsx, .csv)
                      </p>
                    </>
                  )}
                </div>
                {errors.file && (
                  <p className="text-sm text-destructive mt-2">{errors.file}</p>
                )}
              </TabsContent>

              <TabsContent value="drive" className="mt-3">
                <div className="space-y-2">
                  <Input
                    placeholder="https://drive.google.com/..."
                    value={driveUrl}
                    onChange={(e) => {
                      setDriveUrl(e.target.value);
                      setErrors((prev) => ({ ...prev, driveUrl: "" }));
                    }}
                    className={cn(errors.driveUrl && "border-destructive")}
                  />
                  {errors.driveUrl && (
                    <p className="text-sm text-destructive">{errors.driveUrl}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Cole o link de compartilhamento do Google Drive
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            <Upload className="h-4 w-4 mr-2" />
            Enviar Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
