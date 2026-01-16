import { useEffect, useCallback, useState, useMemo, useRef } from "react";
import { 
  X, ChevronLeft, ChevronRight, Download, Image, Video, Music, 
  Play, Pause, Volume2, ZoomIn, ZoomOut, RotateCcw, PlayCircle, PauseCircle,
  Maximize2, Minimize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";

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
  currentIndex?: number;
  totalCount?: number;
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

// Helper function to calculate distance between two touch points
const getTouchDistance = (touch1: React.Touch, touch2: React.Touch): number => {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
};

const SLIDESHOW_INTERVALS = [
  { value: "3000", label: "3s" },
  { value: "5000", label: "5s" },
  { value: "10000", label: "10s" },
  { value: "15000", label: "15s" },
];

export function MediaLightbox({
  media,
  isOpen,
  onClose,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  pdvName,
  currentIndex,
  totalCount,
}: MediaLightboxProps) {
  // Audio player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Slideshow states
  const [slideshowActive, setSlideshowActive] = useState(false);
  const [slideshowInterval, setSlideshowInterval] = useState(5000);
  const [slideshowProgress, setSlideshowProgress] = useState(0);
  const slideshowTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Zoom states
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPinchDistance, setInitialPinchDistance] = useState(0);
  const [initialZoom, setInitialZoom] = useState(1);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Swipe gesture for mobile navigation (only when not zoomed)
  const swipeEnabled = zoomLevel === 1 && media?.media_type === "image";
  
  const { handlers: swipeHandlers, swipeOffset, isSwiping } = useSwipeGesture({
    onSwipeLeft: () => {
      if (hasNext && onNext) {
        setSlideshowActive(false);
        onNext();
      }
    },
    onSwipeRight: () => {
      if (hasPrevious && onPrevious) {
        setSlideshowActive(false);
        onPrevious();
      }
    },
    threshold: 50,
    enabled: swipeEnabled,
  });

  // Generate random wave heights for audio visualization
  const waveHeights = useMemo(() => 
    Array.from({ length: 40 }, () => Math.random() * 100), 
    []
  );

  // Reset zoom and slideshow when media changes
  useEffect(() => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    setSlideshowProgress(0);
    setIsPlaying(false);
    setAudioProgress(0);
    setAudioDuration(0);
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
  }, [media?.id]);

  // Slideshow timer
  useEffect(() => {
    if (!slideshowActive || !hasNext || media?.media_type !== "image") {
      if (slideshowTimerRef.current) clearTimeout(slideshowTimerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      setSlideshowProgress(0);
      return;
    }

    // Progress animation
    const progressStep = 100 / (slideshowInterval / 50);
    setSlideshowProgress(0);
    
    progressTimerRef.current = setInterval(() => {
      setSlideshowProgress(prev => Math.min(100, prev + progressStep));
    }, 50);

    // Navigate to next
    slideshowTimerRef.current = setTimeout(() => {
      onNext?.();
    }, slideshowInterval);

    return () => {
      if (slideshowTimerRef.current) clearTimeout(slideshowTimerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [slideshowActive, slideshowInterval, hasNext, onNext, media?.id, media?.media_type]);

  // Stop slideshow when lightbox closes
  useEffect(() => {
    if (!isOpen) {
      setSlideshowActive(false);
    }
  }, [isOpen]);

  // Pause slideshow when window loses focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && slideshowActive) {
        setSlideshowActive(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [slideshowActive]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await dialogRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Erro ao alternar fullscreen:", error);
    }
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;
    
    switch (e.key) {
      case "Escape":
        onClose();
        break;
      case "ArrowLeft":
        if (hasPrevious && onPrevious) {
          setSlideshowActive(false);
          onPrevious();
        }
        break;
      case "ArrowRight":
        if (hasNext && onNext) {
          setSlideshowActive(false);
          onNext();
        }
        break;
      case " ":
        e.preventDefault();
        if (media?.media_type === "audio" || media?.media_type === "video") {
          togglePlayPause();
        }
        break;
      case "s":
      case "S":
        if (media?.media_type === "image") {
          setSlideshowActive(prev => !prev);
        }
        break;
      case "+":
      case "=":
        if (media?.media_type === "image") {
          setZoomLevel(prev => Math.min(4, prev + 0.5));
        }
        break;
      case "-":
        if (media?.media_type === "image") {
          setZoomLevel(prev => Math.max(1, prev - 0.5));
        }
        break;
      case "0":
        if (media?.media_type === "image") {
          setZoomLevel(1);
          setPanPosition({ x: 0, y: 0 });
        }
        break;
      case "f":
      case "F":
        toggleFullscreen();
        break;
    }
  }, [isOpen, hasPrevious, hasNext, onPrevious, onNext, onClose, media, toggleFullscreen]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

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

  // Zoom handlers
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (media?.media_type !== "image") return;
    e.preventDefault();
    
    // Pause slideshow on interaction
    setSlideshowActive(false);
    
    const delta = e.deltaY > 0 ? -0.25 : 0.25;
    setZoomLevel(prev => {
      const newZoom = Math.min(4, Math.max(1, prev + delta));
      if (newZoom === 1) {
        setPanPosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  }, [media?.media_type]);

  const handleDoubleClick = useCallback(() => {
    if (media?.media_type !== "image") return;
    setSlideshowActive(false);
    
    if (zoomLevel > 1) {
      setZoomLevel(1);
      setPanPosition({ x: 0, y: 0 });
    } else {
      setZoomLevel(2);
    }
  }, [zoomLevel, media?.media_type]);

  // Pan/drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoomLevel <= 1 || media?.media_type !== "image") return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
  }, [zoomLevel, panPosition, media?.media_type]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Limit pan based on zoom level
    const maxPan = (zoomLevel - 1) * 150;
    setPanPosition({
      x: Math.max(-maxPan, Math.min(maxPan, newX)),
      y: Math.max(-maxPan, Math.min(maxPan, newY)),
    });
  }, [isDragging, dragStart, zoomLevel]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch handlers for pinch-to-zoom (combined with swipe)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (media?.media_type !== "image") return;
    
    if (e.touches.length === 2) {
      // Pinch-to-zoom
      e.preventDefault();
      setSlideshowActive(false);
      const distance = getTouchDistance(e.touches[0], e.touches[1]);
      setInitialPinchDistance(distance);
      setInitialZoom(zoomLevel);
    } else if (e.touches.length === 1) {
      if (zoomLevel > 1) {
        // Pan when zoomed in
        setIsDragging(true);
        setDragStart({ 
          x: e.touches[0].clientX - panPosition.x, 
          y: e.touches[0].clientY - panPosition.y 
        });
      } else {
        // Swipe navigation when at normal zoom
        swipeHandlers.onTouchStart(e);
      }
    }
  }, [zoomLevel, panPosition, media?.media_type, swipeHandlers]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (media?.media_type !== "image") return;
    
    if (e.touches.length === 2 && initialPinchDistance > 0) {
      e.preventDefault();
      const distance = getTouchDistance(e.touches[0], e.touches[1]);
      const scale = distance / initialPinchDistance;
      const newZoom = Math.min(4, Math.max(1, initialZoom * scale));
      setZoomLevel(newZoom);
      
      if (newZoom === 1) {
        setPanPosition({ x: 0, y: 0 });
      }
    } else if (e.touches.length === 1) {
      if (isDragging && zoomLevel > 1) {
        // Pan when zoomed in
        const newX = e.touches[0].clientX - dragStart.x;
        const newY = e.touches[0].clientY - dragStart.y;
        
        const maxPan = (zoomLevel - 1) * 150;
        setPanPosition({
          x: Math.max(-maxPan, Math.min(maxPan, newX)),
          y: Math.max(-maxPan, Math.min(maxPan, newY)),
        });
      } else if (zoomLevel === 1) {
        // Swipe navigation when at normal zoom
        swipeHandlers.onTouchMove(e);
      }
    }
  }, [initialPinchDistance, initialZoom, isDragging, dragStart, zoomLevel, media?.media_type, swipeHandlers]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setInitialPinchDistance(0);
    // Also trigger swipe end
    swipeHandlers.onTouchEnd();
  }, [swipeHandlers]);

  const handleZoomIn = () => {
    setSlideshowActive(false);
    setZoomLevel(prev => Math.min(4, prev + 0.5));
  };

  const handleZoomOut = () => {
    setSlideshowActive(false);
    const newZoom = Math.max(1, zoomLevel - 0.5);
    setZoomLevel(newZoom);
    if (newZoom === 1) {
      setPanPosition({ x: 0, y: 0 });
    }
  };

  const handleResetZoom = () => {
    setSlideshowActive(false);
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const toggleSlideshow = () => {
    setSlideshowActive(prev => !prev);
  };

  if (!media) return null;

  const TypeIcon = getMediaTypeIcon(media.media_type);
  const isImage = media.media_type === "image";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        ref={dialogRef}
        className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-background/95 backdrop-blur-sm border-border"
      >
        <VisuallyHidden>
          <DialogTitle>Visualização de mídia</DialogTitle>
        </VisuallyHidden>
        {/* Slideshow progress bar */}
        {slideshowActive && isImage && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-muted z-20">
            <div 
              className="h-full bg-primary transition-all duration-50 ease-linear"
              style={{ width: `${slideshowProgress}%` }}
            />
          </div>
        )}

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
          
          <div className="flex items-center gap-2">
            {/* Slideshow controls - only for images */}
            {isImage && hasNext && (
              <>
                <Button 
                  variant={slideshowActive ? "default" : "ghost"} 
                  size="sm" 
                  onClick={toggleSlideshow}
                  className="gap-1"
                >
                  {slideshowActive ? (
                    <PauseCircle className="h-4 w-4" />
                  ) : (
                    <PlayCircle className="h-4 w-4" />
                  )}
                  Auto
                </Button>
                <Select 
                  value={slideshowInterval.toString()} 
                  onValueChange={(v) => setSlideshowInterval(parseInt(v))}
                >
                  <SelectTrigger className="w-16 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SLIDESHOW_INTERVALS.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleFullscreen}
              className="rounded-full"
              title={isFullscreen ? "Sair da tela cheia (F)" : "Tela cheia (F)"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-5 w-5" />
              ) : (
                <Maximize2 className="h-5 w-5" />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Navigation arrows */}
        {hasPrevious && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSlideshowActive(false);
              onPrevious?.();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-background/50 hover:bg-background/80"
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
        )}
        {hasNext && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSlideshowActive(false);
              onNext?.();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-background/50 hover:bg-background/80"
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        )}

        {/* Media content */}
        <div 
          className="flex items-center justify-center w-full h-full p-16"
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {media.media_type === "image" && (
            <div
              ref={imageContainerRef}
              className={`relative overflow-hidden ${zoomLevel > 1 ? 'cursor-grab' : 'cursor-zoom-in'} ${isDragging ? 'cursor-grabbing' : ''}`}
              onWheel={handleWheel}
              onDoubleClick={handleDoubleClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <img
                src={media.file_url}
                alt={media.title}
                className="max-w-full max-h-[70vh] object-contain rounded-lg transition-transform duration-200 select-none"
                style={{
                  transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)${isSwiping ? ` translateX(${swipeOffset}px)` : ''}`,
                }}
                draggable={false}
              />
            </div>
          )}

          {media.media_type === "video" && (
            <video
              src={media.file_url}
              controls
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

        {/* Zoom controls - only for images */}
        {isImage && (
          <div className="absolute bottom-20 right-4 z-10 flex items-center gap-1 bg-background/80 rounded-lg p-1 backdrop-blur-sm">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleZoomOut}
              disabled={zoomLevel <= 1}
              className="h-8 w-8"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Badge variant="secondary" className="min-w-[3rem] justify-center">
              {zoomLevel.toFixed(1)}x
            </Badge>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleZoomIn}
              disabled={zoomLevel >= 4}
              className="h-8 w-8"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            {zoomLevel > 1 && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleResetZoom}
                className="h-8 w-8"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-t from-background/80 to-transparent">
          <div className="flex items-center gap-3">
            <span className="font-medium truncate max-w-xs">{media.title}</span>
            <span className="text-sm text-muted-foreground">
              {formatFileSize(media.file_size)}
            </span>
            {totalCount && totalCount > 1 && currentIndex !== undefined && (
              <>
                <span className="text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">
                  {currentIndex + 1} de {totalCount}
                </span>
              </>
            )}
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
