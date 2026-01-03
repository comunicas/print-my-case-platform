import { useState, useRef, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Plus } from "lucide-react";
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
import { MediaCard } from "./MediaCard";

interface MediaSettingsProps {
  organizationId: string;
  selectedPdvId?: string;
}

export function MediaSettings({ organizationId, selectedPdvId }: MediaSettingsProps) {
  const { pdvsWithMedia, isLoading, addMedia, updateMedia, deleteMedia, reorderMedia, uploadMediaFile } = usePDVMarketingMedia(organizationId);
  const [uploadingPdvId, setUploadingPdvId] = useState<string | null>(null);
  const [editingMedia, setEditingMedia] = useState<{ id: string; title: string } | null>(null);
  const [mediaToDelete, setMediaToDelete] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (pdvId: string, mediaList: MarketingMedia[]) => (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = mediaList.findIndex((m) => m.id === active.id);
        const newIndex = mediaList.findIndex((m) => m.id === over.id);
        const newOrder = arrayMove(mediaList, oldIndex, newIndex);
        const orderedIds = newOrder.map((m) => m.id);
        reorderMedia.mutate({ pdvId, orderedIds });
      }
    },
    [reorderMedia]
  );

  const handleFileUpload = async (pdvId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const imageTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    const videoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    const audioTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'];
    const allowedTypes = [...imageTypes, ...videoTypes, ...audioTypes];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Formato inválido",
        description: "Use imagens (PNG, JPG, WEBP, GIF), vídeos (MP4, WEBM, MOV) ou áudios (MP3, WAV, OGG).",
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
      let mediaType: "image" | "video" | "audio" = "image";
      if (videoTypes.includes(file.type)) mediaType = "video";
      else if (audioTypes.includes(file.type)) mediaType = "audio";
      
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

  const filteredPdvs = selectedPdvId && selectedPdvId !== "all"
    ? pdvsWithMedia.filter(p => p.id === selectedPdvId)
    : pdvsWithMedia;

  if (pdvsWithMedia.length === 0) {
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
        Adicione imagens, vídeos e áudios para cada PDV. Arraste para reordenar. Esses arquivos ficam disponíveis para download no catálogo público.
      </div>

      <Accordion 
        type="single" 
        collapsible 
        className="space-y-2"
        defaultValue={selectedPdvId !== "all" ? selectedPdvId : undefined}
      >
        {filteredPdvs.map((pdv) => {
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
                    accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/wav,audio/ogg,audio/webm"
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
                    Adicionar Imagem, Vídeo ou Áudio
                  </Button>

                  {pdv.media.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      Nenhuma mídia adicionada ainda.
                    </div>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd(pdv.id, pdv.media)}
                    >
                      <SortableContext
                        items={pdv.media.map((m) => m.id)}
                        strategy={rectSortingStrategy}
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {pdv.media.map((media) => (
                            <MediaCard
                              key={media.id}
                              media={media}
                              onToggleActive={handleToggleActive}
                              onEdit={(m) => setEditingMedia({ id: m.id, title: m.title })}
                              onDelete={(id) => setMediaToDelete(id)}
                              isEditing={editingMedia?.id === media.id}
                              editTitle={editingMedia?.id === media.id ? editingMedia.title : ""}
                              onEditTitleChange={(title) => setEditingMedia((prev) => prev ? { ...prev, title } : null)}
                              onSaveTitle={handleSaveTitle}
                              onCancelEdit={() => setEditingMedia(null)}
                              formatFileSize={formatFileSize}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
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
