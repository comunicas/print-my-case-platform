import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, Trash2, MapPin, Image, Video, Download, Pencil, X, Check, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { usePDVMarketingMedia, MarketingMedia } from "@/hooks/usePDVMarketingMedia";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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

interface MediaSettingsProps {
  organizationId: string;
}

export function MediaSettings({ organizationId }: MediaSettingsProps) {
  const { pdvsWithMedia, isLoading, addMedia, updateMedia, deleteMedia, uploadMediaFile } = usePDVMarketingMedia(organizationId);
  const [uploadingPdvId, setUploadingPdvId] = useState<string | null>(null);
  const [editingMedia, setEditingMedia] = useState<{ id: string; title: string } | null>(null);
  const [mediaToDelete, setMediaToDelete] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFileUpload = async (pdvId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const imageTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    const videoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    const allowedTypes = [...imageTypes, ...videoTypes];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Formato inválido",
        description: "Use imagens (PNG, JPG, WEBP, GIF) ou vídeos (MP4, WEBM, MOV).",
        variant: "destructive",
      });
      return;
    }

    // Max 50MB
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 50MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingPdvId(pdvId);
    try {
      const { url, size } = await uploadMediaFile(pdvId, file);
      const mediaType = imageTypes.includes(file.type) ? "image" : "video";
      const title = file.name.replace(/\.[^/.]+$/, ""); // Remove extension

      await addMedia.mutateAsync({
        pdv_id: pdvId,
        media_type: mediaType,
        title,
        file_url: url,
        file_size: size,
      });
    } catch (error) {
      console.error("Error uploading media:", error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível enviar o arquivo.",
        variant: "destructive",
      });
    } finally {
      setUploadingPdvId(null);
      if (fileInputRefs.current[pdvId]) {
        fileInputRefs.current[pdvId]!.value = '';
      }
    }
  };

  const handleToggleActive = async (media: MarketingMedia) => {
    await updateMedia.mutateAsync({
      id: media.id,
      is_active: !media.is_active,
    });
  };

  const handleSaveTitle = async () => {
    if (!editingMedia) return;
    await updateMedia.mutateAsync({
      id: editingMedia.id,
      title: editingMedia.title,
    });
    setEditingMedia(null);
  };

  const handleConfirmDelete = async () => {
    if (!mediaToDelete) return;
    await deleteMedia.mutateAsync(mediaToDelete);
    setMediaToDelete(null);
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (pdvsWithMedia.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Nenhum PDV ativo encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Adicione imagens e vídeos para cada PDV. Esses arquivos ficam disponíveis para download no catálogo público.
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {pdvsWithMedia.map((pdv) => {
          const activeCount = pdv.media.filter(m => m.is_active).length;

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
                  {pdv.media.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {activeCount}/{pdv.media.length} ativos
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-6">
                <div className="space-y-4">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                    onChange={(e) => handleFileUpload(pdv.id, e)}
                    className="hidden"
                    ref={(el) => { fileInputRefs.current[pdv.id] = el; }}
                  />

                  <Button
                    variant="outline"
                    onClick={() => fileInputRefs.current[pdv.id]?.click()}
                    disabled={uploadingPdvId === pdv.id}
                    className="w-full border-dashed"
                  >
                    {uploadingPdvId === pdv.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Adicionar Imagem ou Vídeo
                  </Button>

                  {pdv.media.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      Nenhuma mídia adicionada ainda.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pdv.media.map((media) => (
                        <div
                          key={media.id}
                          className={`flex items-center gap-4 p-3 rounded-lg border ${
                            media.is_active ? "bg-background" : "bg-muted/50 opacity-60"
                          }`}
                        >
                          {/* Thumbnail */}
                          <div className="w-16 h-16 rounded-lg border overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center">
                            {media.media_type === "image" ? (
                              <img
                                src={media.file_url}
                                alt={media.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Video className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            {editingMedia?.id === media.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={editingMedia.title}
                                  onChange={(e) => setEditingMedia({ ...editingMedia, title: e.target.value })}
                                  className="h-8"
                                  autoFocus
                                />
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveTitle}>
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingMedia(null)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium truncate">{media.title}</span>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6"
                                    onClick={() => setEditingMedia({ id: media.id, title: media.title })}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  {media.media_type === "image" ? (
                                    <Image className="h-3 w-3" />
                                  ) : (
                                    <Video className="h-3 w-3" />
                                  )}
                                  <span>{media.media_type === "image" ? "Imagem" : "Vídeo"}</span>
                                  {media.file_size && (
                                    <>
                                      <span>•</span>
                                      <span>{formatFileSize(media.file_size)}</span>
                                    </>
                                  )}
                                </div>
                              </>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={media.is_active}
                              onCheckedChange={() => handleToggleActive(media)}
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              asChild
                            >
                              <a href={media.file_url} download target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setMediaToDelete(media.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <AlertDialog open={!!mediaToDelete} onOpenChange={() => setMediaToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover mídia?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O arquivo será permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
