import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, X, ImageIcon, MapPin } from "lucide-react";
import { toast } from "sonner";
import { usePDVCatalogSettings } from "@/hooks/usePDVCatalogSettings";
import { cn } from "@/lib/utils";

interface CouponsSettingsProps {
  organizationId: string;
  selectedPdvId?: string;
  isAdmin?: boolean;
}

export const CouponsSettings = React.forwardRef<HTMLDivElement, CouponsSettingsProps>(
  function CouponsSettings({ organizationId, selectedPdvId, isAdmin = false }, ref) {
  const { pdvsWithSettings, isLoading, upsertSettings, uploadQrCode } = usePDVCatalogSettings(organizationId);
  const [uploadingPdvId, setUploadingPdvId] = useState<string | null>(null);
  const [editingPdv, setEditingPdv] = useState<Record<string, { code: string; qrUrl: string | null; modalText: string | null }>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleToggleEnabled = async (pdvId: string, currentEnabled: boolean) => {
    await upsertSettings.mutateAsync({
      pdv_id: pdvId,
      is_enabled: !currentEnabled,
    });
  };

  const handleCodeChange = (pdvId: string, code: string) => {
    setEditingPdv(prev => ({
      ...prev,
      [pdvId]: {
        ...prev[pdvId],
        code: code.toUpperCase(),
      },
    }));
  };

  const handleQrCodeUpload = async (pdvId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Formato inválido", {
        description: "Use apenas imagens PNG, JPG ou WEBP.",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Arquivo muito grande", {
        description: "A imagem deve ter no máximo 2MB.",
      });
      return;
    }

    setUploadingPdvId(pdvId);
    try {
      const publicUrl = await uploadQrCode(pdvId, file);
      setEditingPdv(prev => ({
        ...prev,
        [pdvId]: {
          ...prev[pdvId],
          qrUrl: publicUrl,
        },
      }));
      toast.success("Imagem enviada!", {
        description: "A imagem do QR Code foi carregada.",
      });
    } catch (error) {
      console.error("Error uploading QR code:", error);
      toast.error("Erro no upload", {
        description: "Não foi possível enviar a imagem.",
      });
    } finally {
      setUploadingPdvId(null);
      if (fileInputRefs.current[pdvId]) {
        fileInputRefs.current[pdvId]!.value = '';
      }
    }
  };

  const handleRemoveQrCode = (pdvId: string) => {
    setEditingPdv(prev => ({
      ...prev,
      [pdvId]: {
        ...prev[pdvId],
        qrUrl: null,
      },
    }));
  };

  const handleModalTextChange = (pdvId: string, text: string) => {
    setEditingPdv(prev => ({
      ...prev,
      [pdvId]: {
        ...prev[pdvId],
        modalText: text,
      },
    }));
  };

  const handleSaveSettings = async (pdvId: string) => {
    const editing = editingPdv[pdvId];
    const pdv = pdvsWithSettings.find(p => p.id === pdvId);
    
    const code = editing?.code ?? pdv?.catalog_settings?.catalog_code ?? "";
    const qrUrl = editing?.qrUrl !== undefined ? editing.qrUrl : (pdv?.catalog_settings?.catalog_qrcode_url ?? null);
    const modalText = editing?.modalText !== undefined ? editing.modalText : (pdv?.catalog_settings?.catalog_modal_text ?? null);

    if (!code.trim()) {
      toast.error("Código obrigatório", {
        description: "Informe o código do catálogo para este PDV.",
      });
      return;
    }

    await upsertSettings.mutateAsync({
      pdv_id: pdvId,
      catalog_code: code.trim(),
      catalog_qrcode_url: qrUrl,
      catalog_modal_text: modalText?.trim() || null,
      is_enabled: true,
    });

    setEditingPdv(prev => {
      const { [pdvId]: _, ...rest } = prev;
      return rest;
    });
  };

  const getEditingValue = (pdvId: string, field: "code" | "qrUrl" | "modalText") => {
    const pdv = pdvsWithSettings.find(p => p.id === pdvId);
    if (field === "code") {
      return editingPdv[pdvId]?.code ?? pdv?.catalog_settings?.catalog_code ?? "";
    }
    if (field === "modalText") {
      return editingPdv[pdvId]?.modalText !== undefined
        ? editingPdv[pdvId]?.modalText
        : (pdv?.catalog_settings?.catalog_modal_text ?? "");
    }
    return editingPdv[pdvId]?.qrUrl !== undefined
      ? editingPdv[pdvId]?.qrUrl
      : (pdv?.catalog_settings?.catalog_qrcode_url ?? null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const filteredPdvs = selectedPdvId && selectedPdvId !== "all"
    ? pdvsWithSettings.filter(p => p.id === selectedPdvId)
    : pdvsWithSettings;

  if (pdvsWithSettings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Nenhum PDV ativo encontrado.</p>
      </div>
    );
  }

  if (filteredPdvs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>PDV selecionado não encontrado.</p>
      </div>
    );
  }

  return (
    <div ref={ref} className="space-y-4">
      {filteredPdvs.map((pdv) => {
        const isEnabled = pdv.catalog_settings?.is_enabled ?? false;
        const currentCode = getEditingValue(pdv.id, "code") as string;
        const currentQrUrl = getEditingValue(pdv.id, "qrUrl") as string | null;
        const currentModalText = getEditingValue(pdv.id, "modalText") as string;

        return (
          <Card 
            key={pdv.id} 
            className={cn(
              "transition-opacity",
              !isEnabled && "opacity-60"
            )}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <span className="font-medium truncate block">{pdv.name}</span>
                    <span className="text-muted-foreground text-sm truncate block">
                      {pdv.location}
                    </span>
                  </div>
                </div>
                {isAdmin ? (
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={() => handleToggleEnabled(pdv.id, isEnabled)}
                    disabled={upsertSettings.isPending}
                  />
                ) : (
                  <Badge variant={isEnabled ? "default" : "secondary"}>
                    {isEnabled ? "Ativo" : "Inativo"}
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {isEnabled ? (
                isAdmin ? (
                  /* Admin Mode - Full editing capabilities */
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-[auto_1fr]">
                      {/* QR Code Section */}
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">QR Code</Label>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(e) => handleQrCodeUpload(pdv.id, e)}
                          className="hidden"
                          ref={(el) => { fileInputRefs.current[pdv.id] = el; }}
                        />

                        {currentQrUrl ? (
                          <div className="space-y-2">
                            <div className="relative w-24 h-24 rounded-lg border overflow-hidden bg-muted">
                              <img
                                src={currentQrUrl}
                                alt="QR Code"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRefs.current[pdv.id]?.click()}
                                disabled={uploadingPdvId === pdv.id}
                                className="text-xs h-7 px-2"
                              >
                                {uploadingPdvId === pdv.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Upload className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveQrCode(pdv.id)}
                                className="text-destructive hover:text-destructive text-xs h-7 px-2"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRefs.current[pdv.id]?.click()}
                            disabled={uploadingPdvId === pdv.id}
                            className="w-24 h-24 border-dashed flex flex-col gap-1"
                          >
                            {uploadingPdvId === pdv.id ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <>
                                <ImageIcon className="h-5 w-5" />
                                <span className="text-xs">Upload</span>
                              </>
                            )}
                          </Button>
                        )}
                      </div>

                      {/* Text Fields Section */}
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label htmlFor={`code-${pdv.id}`} className="text-xs text-muted-foreground uppercase tracking-wide">
                            Código do Catálogo
                          </Label>
                          <Input
                            id={`code-${pdv.id}`}
                            value={currentCode}
                            onChange={(e) => handleCodeChange(pdv.id, e.target.value)}
                            placeholder="PMC-001"
                            className="font-mono h-9"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor={`modal-text-${pdv.id}`} className="text-xs text-muted-foreground uppercase tracking-wide">
                            Texto da Modal
                          </Label>
                          <Input
                            id={`modal-text-${pdv.id}`}
                            value={currentModalText}
                            onChange={(e) => handleModalTextChange(pdv.id, e.target.value)}
                            placeholder="🎁 Presente para você: R$ 10 OFF!"
                            className="h-9"
                          />
                          <p className="text-xs text-muted-foreground">
                            Deixe em branco para usar o texto padrão.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2 border-t">
                      <Button
                        onClick={() => handleSaveSettings(pdv.id)}
                        disabled={upsertSettings.isPending}
                        size="sm"
                      >
                        {upsertSettings.isPending && (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        )}
                        Salvar
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Readonly Mode - View only */
                  <div className="grid gap-4 md:grid-cols-[auto_1fr]">
                    {/* QR Code Display */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">QR Code</Label>
                      {currentQrUrl ? (
                        <div className="relative w-24 h-24 rounded-lg border overflow-hidden bg-muted">
                          <img
                            src={currentQrUrl}
                            alt="QR Code"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-lg border border-dashed flex items-center justify-center bg-muted/50">
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Text Fields Display */}
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                          Código do Catálogo
                        </Label>
                        <p className="font-mono text-sm py-2 px-3 bg-muted rounded-md">
                          {currentCode || <span className="text-muted-foreground italic">Não configurado</span>}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                          Texto da Modal
                        </Label>
                        <p className="text-sm py-2 px-3 bg-muted rounded-md">
                          {currentModalText || <span className="text-muted-foreground italic">Texto padrão</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {isAdmin ? "Ative o cupom para configurar código e QR Code." : "Cupom não configurado para este PDV."}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
});
