import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  GripVertical,
  Image,
  Video,
  Music,
  Download,
  Pencil,
  Trash2,
  Play,
  Check,
  X,
} from "lucide-react";
import { MarketingMedia } from "@/hooks/usePDVMarketingMedia";

interface MediaCardProps {
  media: MarketingMedia;
  onToggleActive: (media: MarketingMedia) => void;
  onEdit: (media: MarketingMedia) => void;
  onDelete: (id: string) => void;
  isEditing: boolean;
  editTitle: string;
  onEditTitleChange: (title: string) => void;
  onSaveTitle: () => void;
  onCancelEdit: () => void;
  formatFileSize: (bytes: number | null) => string;
}

export function MediaCard({
  media,
  onToggleActive,
  onEdit,
  onDelete,
  isEditing,
  editTitle,
  onEditTitleChange,
  onSaveTitle,
  onCancelEdit,
  formatFileSize,
}: MediaCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: media.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const mediaTypeLabel = {
    image: "Imagem",
    video: "Vídeo",
    audio: "Áudio",
  };

  const MediaTypeIcon = {
    image: Image,
    video: Video,
    audio: Music,
  };

  const Icon = MediaTypeIcon[media.media_type] || Image;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-xl border bg-card overflow-hidden transition-shadow ${
        isDragging ? "shadow-lg ring-2 ring-primary/20 z-50" : ""
      } ${!media.is_active ? "opacity-60" : ""}`}
    >
      {/* Header with drag handle and toggle */}
      <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between">
        <button
          {...attributes}
          {...listeners}
          className="p-1.5 rounded-md bg-background/80 backdrop-blur-sm border shadow-sm cursor-grab active:cursor-grabbing hover:bg-background transition-colors"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="bg-background/80 backdrop-blur-sm"
          >
            {mediaTypeLabel[media.media_type] || "Mídia"}
          </Badge>
          <div className="p-1 rounded-md bg-background/80 backdrop-blur-sm border shadow-sm">
            <Switch
              checked={media.is_active}
              onCheckedChange={() => onToggleActive(media)}
              className="scale-75"
            />
          </div>
        </div>
      </div>

      {/* Media preview */}
      <AspectRatio ratio={4 / 3}>
        {media.media_type === "image" ? (
          <img
            src={media.file_url}
            alt={media.title}
            className="w-full h-full object-cover"
          />
        ) : media.media_type === "video" ? (
          <div className="w-full h-full bg-muted flex items-center justify-center relative">
            <video
              src={media.file_url}
              className="w-full h-full object-cover"
              muted
              preload="metadata"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="w-14 h-14 rounded-full bg-background/90 flex items-center justify-center shadow-lg">
                <Play className="h-6 w-6 text-foreground ml-1" />
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Music className="h-8 w-8 text-primary" />
            </div>
            {/* Audio waveform decoration */}
            <div className="flex items-end gap-1 h-8">
              {[3, 5, 8, 6, 9, 4, 7, 5, 6, 8, 4, 6].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-primary/30 rounded-full"
                  style={{ height: `${h * 3}px` }}
                />
              ))}
            </div>
          </div>
        )}
      </AspectRatio>

      {/* Footer with info and actions */}
      <div className="p-3 space-y-2 bg-card">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={editTitle}
              onChange={(e) => onEditTitleChange(e.target.value)}
              className="h-8 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") onSaveTitle();
                if (e.key === "Escape") onCancelEdit();
              }}
            />
            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={onSaveTitle}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={onCancelEdit}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-medium text-sm truncate flex-1" title={media.title}>
                {media.title}
              </h4>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onEdit(media)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Icon className="h-3 w-3" />
              <span>{mediaTypeLabel[media.media_type]}</span>
              {media.file_size && (
                <>
                  <span>•</span>
                  <span>{formatFileSize(media.file_size)}</span>
                </>
              )}
            </div>
          </>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-1 pt-1">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-8"
            asChild
          >
            <a href={media.file_url} download target="_blank" rel="noopener noreferrer">
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Baixar
            </a>
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(media.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
