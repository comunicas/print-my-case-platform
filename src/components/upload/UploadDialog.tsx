import { useState, useRef, useEffect, useMemo } from "react";
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
import { Upload, FileSpreadsheet, Link, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { UploadType, ColumnValidationResult } from "@/lib/schemas/upload";
import { validateSpreadsheetColumns } from "@/lib/utils/spreadsheet-validator";

interface PDVOption {
  id: string;
  name: string;
  machine_id: string;
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
  isSubmitting?: boolean;
}

function generatePeriods(): string[] {
  const months = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
  ];
  const periods: string[] = [];
  const now = new Date();
  
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();
    periods.push(`${monthName} ${year}`);
  }
  
  return periods;
}

export function UploadDialog({
  open,
  onOpenChange,
  pdvOptions,
  onSubmit,
  isSubmitting = false,
}: UploadDialogProps) {
  const [pdvId, setPdvId] = useState("");
  const [type, setType] = useState<UploadType>("sales");
  const [period, setPeriod] = useState("");
  const [source, setSource] = useState<"file" | "drive">("file");
  const [file, setFile] = useState<File | null>(null);
  const [driveUrl, setDriveUrl] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDragOver, setIsDragOver] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ColumnValidationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const periods = useMemo(() => generatePeriods(), []);

  // Re-validate when type changes and file exists
  useEffect(() => {
    if (file) {
      validateFile(file);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- validateFile is stable, we only want to re-validate when type changes
  }, [type, file]);

  const resetForm = () => {
    setPdvId("");
    setType("sales");
    setPeriod("");
    setSource("file");
    setFile(null);
    setDriveUrl("");
    setErrors({});
    setIsDragOver(false);
    setIsValidating(false);
    setValidationResult(null);
  };

  const handleClose = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  const validateFile = async (fileToValidate: File) => {
    setIsValidating(true);
    setValidationResult(null);
    setErrors((prev) => ({ ...prev, file: "" }));

    try {
      const result = await validateSpreadsheetColumns(fileToValidate, type);
      setValidationResult(result);

      if (!result.isValid) {
        setErrors((prev) => ({
          ...prev,
          file: `Colunas obrigatórias faltando: ${result.missingColumns.join(", ")}`,
        }));
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        file: "Erro ao ler o arquivo. Verifique se é um arquivo Excel válido.",
      }));
    } finally {
      setIsValidating(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!pdvId) newErrors.pdvId = "Selecione um PDV";
    if (!period) newErrors.period = "Selecione o período";
    if (source === "file" && !file) newErrors.file = "Selecione um arquivo";
    if (source === "file" && file && validationResult && !validationResult.isValid) {
      newErrors.file = `Colunas obrigatórias faltando: ${validationResult.missingColumns.join(", ")}`;
    }
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
      validateFile(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && isValidFileType(selectedFile)) {
      setFile(selectedFile);
      validateFile(selectedFile);
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
    setValidationResult(null);
    setErrors((prev) => ({ ...prev, file: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isSubmitDisabled = 
    isValidating || 
    isSubmitting ||
    (source === "file" && file && validationResult && !validationResult.isValid);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[500px] max-h-[90vh] overflow-y-auto overflow-x-hidden">
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
                    {pdv.name} ({pdv.machine_id})
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
                  onClick={() => !file && fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                    !file && "cursor-pointer",
                    isDragOver
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-primary/50",
                    errors.file && !validationResult?.isValid && "border-destructive"
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
                    <div className="space-y-3">
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

                      {/* Validation Status */}
                      {isValidating && (
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Validando colunas...</span>
                        </div>
                      )}

                      {validationResult && !isValidating && (
                        <div className={cn(
                          "rounded-md p-3 text-sm",
                          validationResult.isValid 
                            ? "bg-primary/10 text-primary" 
                            : "bg-destructive/10 text-destructive"
                        )}>
                          {validationResult.isValid ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Arquivo válido - {validationResult.totalRows} registros encontrados</span>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                <span className="font-medium">Colunas obrigatórias faltando:</span>
                              </div>
                              <ul className="list-disc list-inside pl-1 space-y-1">
                                {validationResult.missingColumns.map((col) => (
                                  <li key={col}>{col}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
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
                {errors.file && !validationResult && (
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
                    Cole o link de compartilhamento do Google Drive (validação será feita no servidor)
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
          <Button onClick={handleSubmit} disabled={!!isSubmitDisabled}>
            {isValidating || isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {isSubmitting ? "Enviando..." : "Enviar Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
