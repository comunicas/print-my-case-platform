import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Slider } from "@/components/ui/slider";
import {
  GripVertical,
  Image,
  Video,
  Music,
  Download,
  Pencil,
  Trash2,
  Play,
  Pause,
  Check,
  X,
  Maximize2,
} from "lucide-react";
import { MarketingMedia } from "@/hooks/usePDVMarketingMedia";

interface MediaCardProps {
  media: MarketingMedia;
  mode?: "admin" | "readonly";
  pdvName?: string; // Mostrar nome do PDV no modo readonly
  onToggleActive?: (media: MarketingMedia) => void;
  onEdit?: (media: MarketingMedia) => void;
  onDelete?: (id: string) => void;
  isEditing?: boolean;
  editTitle?: string;
  onEditTitleChange?: (title: string) => void;
  onSaveTitle?: () => void;
  onCancelEdit?: () => void;
  formatFileSize?: (bytes: number | null) => string;
  onClick?: () => void;
  onPauseMedia?: () => void; // Callback chamado antes de abrir lightbox para pausar mídia
}

const defaultFormatFileSize = (bytes: number | null) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function MediaCard({
  media,
  mode = "admin",
  pdvName,
  onToggleActive,
  onEdit,
  onDelete,
  onClick,
  onPauseMedia,
  isEditing = false,
  editTitle = "",
  onEditTitleChange,
  onSaveTitle,
  onCancelEdit,
  formatFileSize = defaultFormatFileSize,
}: MediaCardProps) {
  const isAdmin = mode === "admin";
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: media.id, disabled: !isAdmin });

  // Audio player state
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  // Video player state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Memoized random heights for waveform animation (avoid Math.random during render)
  const waveHeights = useMemo(() => 
    Array.from({ length: 12 }, () => Math.floor(Math.random() * 6) + 3), 
    []
  );

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

  // Format time in mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Audio controls
  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isAudioPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsAudioPlaying(!isAudioPlaying);
  };

  const handleAudioTimeUpdate = () => {
    if (!audioRef.current) return;
    setAudioProgress(audioRef.current.currentTime);
  };

  const handleAudioLoadedMetadata = () => {
    if (!audioRef.current) return;
    setAudioDuration(audioRef.current.duration);
  };

  const handleAudioSeek = (value: number[]) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = value[0];
    setAudioProgress(value[0]);
  };

  const handleAudioEnded = () => {
    setIsAudioPlaying(false);
    setAudioProgress(0);
  };

  // Video controls
  const handleVideoClick = () => {
    if (!videoRef.current) return;
    if (isVideoPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const handleVideoPlay = () => setIsVideoPlaying(true);
  const handleVideoPause = () => setIsVideoPlaying(false);
  const handleVideoEnded = () => setIsVideoPlaying(false);

  // Pause all media (called before opening lightbox)
  const pauseAllMedia = useCallback(() => {
    audioRef.current?.pause();
    videoRef.current?.pause();
    setIsAudioPlaying(false);
    setIsVideoPlaying(false);
    onPauseMedia?.();
  }, [onPauseMedia]);

  // Cleanup on unmount - capture refs before cleanup
  useEffect(() => {
    const audio = audioRef.current;
    const video = videoRef.current;
    return () => {
      audio?.pause();
      video?.pause();
    };
  }, []);

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
        {isAdmin ? (
          <button
            {...attributes}
            {...listeners}
            className="p-1.5 rounded-md bg-background/80 backdrop-blur-sm border shadow-sm cursor-grab active:cursor-grabbing hover:bg-background transition-colors"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
        ) : (
          <div /> // Spacer
        )}
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="bg-background/80 backdrop-blur-sm"
          >
            {mediaTypeLabel[media.media_type] || "Mídia"}
          </Badge>
          {isAdmin && onToggleActive && (
            <div className="p-1 rounded-md bg-background/80 backdrop-blur-sm border shadow-sm">
              <Switch
                checked={media.is_active}
                onCheckedChange={() => onToggleActive(media)}
                className="scale-75"
              />
            </div>
          )}
        </div>
      </div>

      {/* Media preview */}
      <AspectRatio ratio={4 / 3}>
        <div 
          className={`relative w-full h-full ${onClick ? 'cursor-pointer group/preview' : ''}`}
          onClick={(e) => {
            // Don't trigger onClick if clicking on controls
            if ((e.target as HTMLElement).closest('button, video[controls]')) return;
            // Pause all media before opening lightbox
            pauseAllMedia();
            onClick?.();
          }}
        >
          {/* Expand overlay on hover */}
          {onClick && (
            <div className="absolute inset-0 z-10 bg-black/0 group-hover/preview:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover/preview:opacity-100 pointer-events-none">
              <div className="w-10 h-10 rounded-full bg-background/90 flex items-center justify-center shadow-lg">
                <Maximize2 className="h-5 w-5 text-foreground" />
              </div>
            </div>
          )}
          
          {media.media_type === "image" ? (
            <img
              src={media.file_url}
              alt={media.title}
              className="w-full h-full object-cover"
            />
          ) : media.media_type === "video" ? (
          <div className="w-full h-full bg-muted relative">
            <video
              ref={videoRef}
              src={media.file_url}
              className="w-full h-full object-cover"
              controls={isVideoPlaying}
              onPlay={handleVideoPlay}
              onPause={handleVideoPause}
              onEnded={handleVideoEnded}
              preload="metadata"
            />
            {!isVideoPlaying && (
              <div
                className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer transition-opacity hover:bg-black/30"
                onClick={(e) => {
                  e.stopPropagation();
                  handleVideoClick();
                }}
              >
                <div className="w-14 h-14 rounded-full bg-background/90 flex items-center justify-center shadow-lg transition-transform hover:scale-110">
                  <Play className="h-6 w-6 text-foreground ml-1" />
                </div>
              </div>
            )}
            {/* Botão de expandir quando vídeo está tocando - posicionado no canto inferior direito para não conflitar com badge */}
            {isVideoPlaying && onClick && (
              <button
                className="absolute bottom-3 right-3 z-20 w-10 h-10 rounded-full bg-background/90 flex items-center justify-center shadow-lg hover:bg-background transition-all hover:scale-105"
                onClick={(e) => {
                  e.stopPropagation();
                  pauseAllMedia();
                  onClick();
                }}
                aria-label="Expandir vídeo"
              >
                <Maximize2 className="h-5 w-5" />
              </button>
            )}
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex flex-col items-center justify-center gap-3 p-4">
            <audio
              ref={audioRef}
              src={media.file_url}
              onTimeUpdate={handleAudioTimeUpdate}
              onLoadedMetadata={handleAudioLoadedMetadata}
              onEnded={handleAudioEnded}
              preload="metadata"
            />
            
            {/* Play/Pause button */}
            <button
              onClick={toggleAudio}
              aria-label={isAudioPlaying ? "Pausar áudio" : "Reproduzir áudio"}
              className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center transition-all hover:bg-primary/20 hover:scale-105"
            >
              {isAudioPlaying ? (
                <Pause className="h-6 w-6 text-primary" />
              ) : (
                <Play className="h-6 w-6 text-primary ml-0.5" />
              )}
            </button>
            
            {/* Progress bar */}
            <div className="w-full max-w-[200px] space-y-1">
              <Slider
                value={[audioProgress]}
                max={audioDuration || 100}
                step={0.1}
                onValueChange={handleAudioSeek}
                className="cursor-pointer"
                aria-label="Progresso do áudio"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(audioProgress)}</span>
                <span>{formatTime(audioDuration)}</span>
              </div>
            </div>
            
            {/* Animated waveform */}
            <div className="flex items-end gap-0.5 h-6">
              {waveHeights.map((h, i) => (
                <div
                  key={i}
                  className={`w-1 bg-primary/40 rounded-full transition-all duration-150 ${
                    isAudioPlaying ? "animate-pulse" : ""
                  }`}
                  style={{
                    height: `${h * 2}px`,
                    animationDelay: `${i * 50}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
        </div>
      </AspectRatio>

      {/* Footer with info and actions */}
      <div className="p-3 space-y-2 bg-card">
        {isEditing && isAdmin && onEditTitleChange && onSaveTitle && onCancelEdit ? (
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
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-sm truncate" title={media.title}>
                  {media.title}
                </h4>
                {pdvName && (
                  <p className="text-xs text-muted-foreground truncate" title={pdvName}>
                    {pdvName}
                  </p>
                )}
              </div>
              {isAdmin && onEdit && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onEdit(media)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
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
          {isAdmin && onDelete && (
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(media.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
