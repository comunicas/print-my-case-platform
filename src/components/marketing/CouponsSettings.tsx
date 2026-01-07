import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, X, ImageIcon, MapPin, QrCode } from "lucide-react";
import { toast } from "sonner";
import { usePDVCatalogSettings } from "@/hooks/usePDVCatalogSettings";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface CouponsSettingsProps {
  organizationId: string;
  selectedPdvId?: string;
}

export function CouponsSettings({ organizationId, selectedPdvId }: CouponsSettingsProps) {
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
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Configure código e QR Code para cada PDV individualmente. Quando um PDV é selecionado no catálogo, seu código específico será exibido.
      </div>

      <Accordion 
        type="single" 
        collapsible 
        className="space-y-2"
        defaultValue={selectedPdvId !== "all" ? selectedPdvId : undefined}
      >
        {filteredPdvs.map((pdv) => {
          const isEnabled = pdv.catalog_settings?.is_enabled ?? false;
          const currentCode = getEditingValue(pdv.id, "code") as string;
          const currentQrUrl = getEditingValue(pdv.id, "qrUrl") as string | null;
          const currentModalText = getEditingValue(pdv.id, "modalText") as string;

          return (
            <AccordionItem key={pdv.id} value={pdv.id} className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="font-medium">{pdv.name}</span>
                    <span className="text-muted-foreground text-sm ml-2">
                      {pdv.location}
                    </span>
                  </div>
                  {isEnabled && (
                    <Badge variant="secondary" className="ml-2">
                      <QrCode className="h-3 w-3 mr-1" />
                      Código ativo
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Ativar código para este PDV</Label>
                      <p className="text-sm text-muted-foreground">
                        Quando ativo, este PDV terá seu próprio código no catálogo.
                      </p>
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={() => handleToggleEnabled(pdv.id, isEnabled)}
                      disabled={upsertSettings.isPending}
                    />
                  </div>

                  {isEnabled && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor={`code-${pdv.id}`}>Código do catálogo</Label>
                        <Input
                          id={`code-${pdv.id}`}
                          value={currentCode}
                          onChange={(e) => handleCodeChange(pdv.id, e.target.value)}
                          placeholder="PMC-001"
                          className="font-mono"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`modal-text-${pdv.id}`}>Texto da modal do cupom</Label>
                        <Input
                          id={`modal-text-${pdv.id}`}
                          value={currentModalText}
                          onChange={(e) => handleModalTextChange(pdv.id, e.target.value)}
                          placeholder="🎁 Presente para você: R$ 10 OFF na sua próxima compra!"
                        />
                        <p className="text-xs text-muted-foreground">
                          Deixe em branco para usar o texto padrão da organização.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Imagem do QR Code</Label>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(e) => handleQrCodeUpload(pdv.id, e)}
                          className="hidden"
                          ref={(el) => { fileInputRefs.current[pdv.id] = el; }}
                        />

                        {currentQrUrl ? (
                          <div className="flex items-start gap-4">
                            <div className="relative w-24 h-24 rounded-lg border overflow-hidden">
                              <img
                                src={currentQrUrl}
                                alt="QR Code"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="space-y-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRefs.current[pdv.id]?.click()}
                                disabled={uploadingPdvId === pdv.id}
                              >
                                {uploadingPdvId === pdv.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <Upload className="h-4 w-4 mr-2" />
                                )}
                                Alterar
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveQrCode(pdv.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Remover
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRefs.current[pdv.id]?.click()}
                            disabled={uploadingPdvId === pdv.id}
                            className="w-full h-24 border-dashed"
                          >
                            {uploadingPdvId === pdv.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <ImageIcon className="h-4 w-4 mr-2" />
                            )}
                            Enviar imagem do QR Code
                          </Button>
                        )}
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG ou WEBP. Máximo 2MB.
                        </p>
                      </div>

                      <div className="flex justify-end pt-2">
                        <Button
                          onClick={() => handleSaveSettings(pdv.id)}
                          disabled={upsertSettings.isPending}
                          size="sm"
                        >
                          {upsertSettings.isPending && (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          )}
                          Salvar Configurações
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
