import { useEffect, useCallback, useState, useMemo } from "react";
import { X, ChevronLeft, ChevronRight, Download, Image, Video, Music, Play, Pause, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface MarketingMedia {
  id: string;
  title: string;
  file_url: string;
  media_type: string;
  file_size: number | null;
}

interface MediaLightboxProps {
  media: MarketingMedia | null;
  isOpen: boolean;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  pdvName?: string;
}

const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return "N/A";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getMediaTypeIcon = (type: string) => {
  switch (type) {
    case "image": return Image;
    case "video": return Video;
    case "audio": return Music;
    default: return Image;
  }
};

const getMediaTypeLabel = (type: string) => {
  switch (type) {
    case "image": return "Imagem";
    case "video": return "Vídeo";
    case "audio": return "Áudio";
    default: return type;
  }
};

export function MediaLightbox({
  media,
  isOpen,
  onClose,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  pdvName,
}: MediaLightboxProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Generate random wave heights for audio visualization
  const waveHeights = useMemo(() => 
    Array.from({ length: 40 }, () => Math.random() * 100), 
    []
  );

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;
    
    switch (e.key) {
      case "Escape":
        onClose();
        break;
      case "ArrowLeft":
        if (hasPrevious && onPrevious) onPrevious();
        break;
      case "ArrowRight":
        if (hasNext && onNext) onNext();
        break;
      case " ":
        e.preventDefault();
        if (media?.media_type === "audio" || media?.media_type === "video") {
          togglePlayPause();
        }
        break;
    }
  }, [isOpen, hasPrevious, hasNext, onPrevious, onNext, onClose, media]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Reset state when media changes
  useEffect(() => {
    setIsPlaying(false);
    setAudioProgress(0);
    setAudioDuration(0);
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
  }, [media?.id]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
      }
    };
  }, [audioElement]);

  const togglePlayPause = () => {
    if (audioElement) {
      if (isPlaying) {
        audioElement.pause();
      } else {
        audioElement.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioElement) {
      setAudioProgress((audioElement.currentTime / audioElement.duration) * 100);
    }
  };

  const handleAudioLoadedMetadata = () => {
    if (audioElement) {
      setAudioDuration(audioElement.duration);
    }
  };

  const handleAudioSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioElement) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      audioElement.currentTime = percent * audioElement.duration;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    if (media) {
      window.open(media.file_url, "_blank");
    }
  };

  if (!media) return null;

  const TypeIcon = getMediaTypeIcon(media.media_type);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-background/95 backdrop-blur-sm border-border">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-background/80 to-transparent">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <TypeIcon className="h-3 w-3" />
              {getMediaTypeLabel(media.media_type)}
            </Badge>
            {pdvName && (
              <Badge variant="outline">{pdvName}</Badge>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation arrows */}
        {hasPrevious && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-background/50 hover:bg-background/80"
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
        )}
        {hasNext && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-background/50 hover:bg-background/80"
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        )}

        {/* Media content */}
        <div className="flex items-center justify-center w-full h-full p-16">
          {media.media_type === "image" && (
            <img
              src={media.file_url}
              alt={media.title}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          )}

          {media.media_type === "video" && (
            <video
              src={media.file_url}
              controls
              autoPlay
              className="max-w-full max-h-full rounded-lg"
            />
          )}

          {media.media_type === "audio" && (
            <div className="w-full max-w-2xl bg-card rounded-xl p-8 space-y-6">
              <audio
                ref={setAudioElement}
                src={media.file_url}
                onTimeUpdate={handleAudioTimeUpdate}
                onLoadedMetadata={handleAudioLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
              />
              
              {/* Waveform visualization */}
              <div className="flex items-end justify-center gap-1 h-32">
                {waveHeights.map((height, i) => (
                  <div
                    key={i}
                    className={`w-2 rounded-full transition-all duration-150 ${
                      (i / waveHeights.length) * 100 <= audioProgress
                        ? "bg-primary"
                        : "bg-muted"
                    }`}
                    style={{ 
                      height: `${Math.max(20, height)}%`,
                      animationDelay: `${i * 50}ms`,
                    }}
                  />
                ))}
              </div>

              {/* Progress bar */}
              <div
                className="w-full h-2 bg-muted rounded-full cursor-pointer overflow-hidden"
                onClick={handleAudioSeek}
              >
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${audioProgress}%` }}
                />
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {audioElement ? formatTime(audioElement.currentTime) : "0:00"}
                </span>
                
                <Button
                  size="lg"
                  onClick={togglePlayPause}
                  className="h-16 w-16 rounded-full"
                >
                  {isPlaying ? (
                    <Pause className="h-8 w-8" />
                  ) : (
                    <Play className="h-8 w-8 ml-1" />
                  )}
                </Button>

                <span className="text-sm text-muted-foreground">
                  {formatTime(audioDuration)}
                </span>
              </div>

              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Volume2 className="h-4 w-4" />
                <span className="text-sm">{media.title}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-t from-background/80 to-transparent">
          <div className="flex items-center gap-3">
            <span className="font-medium truncate max-w-xs">{media.title}</span>
            <span className="text-sm text-muted-foreground">
              {formatFileSize(media.file_size)}
            </span>
          </div>
          <Button variant="secondary" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Baixar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
