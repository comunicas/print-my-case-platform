import { useEffect, useCallback, useState, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { MediaLightboxProps } from "./types";
import { LightboxHeader } from "./LightboxHeader";
import { LightboxFooter } from "./LightboxFooter";
import { LightboxNavigation } from "./LightboxNavigation";
import { LightboxContent } from "./LightboxContent";
import { LightboxZoomControls } from "./LightboxZoomControls";

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
  // Slideshow states
  const [slideshowActive, setSlideshowActive] = useState(false);
  const [slideshowInterval, setSlideshowInterval] = useState(5000);
  const [slideshowProgress, setSlideshowProgress] = useState(0);
  const slideshowTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Zoom states
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  
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

  const stopSlideshow = useCallback(() => {
    setSlideshowActive(false);
  }, []);

  // Reset zoom and slideshow when media changes
  useEffect(() => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    setSlideshowProgress(0);
  }, [media?.id]);

  // Slideshow timer
  useEffect(() => {
    if (!slideshowActive || !hasNext || media?.media_type !== "image") {
      if (slideshowTimerRef.current) clearTimeout(slideshowTimerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      setSlideshowProgress(0);
      return;
    }

    const progressStep = 100 / (slideshowInterval / 50);
    setSlideshowProgress(0);
    
    progressTimerRef.current = setInterval(() => {
      setSlideshowProgress(prev => Math.min(100, prev + progressStep));
    }, 50);

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

  // Zoom handlers for controls
  const handleZoomIn = useCallback(() => {
    stopSlideshow();
    setZoomLevel(prev => Math.min(4, prev + 0.5));
  }, [stopSlideshow]);

  const handleZoomOut = useCallback(() => {
    stopSlideshow();
    const newZoom = Math.max(1, zoomLevel - 0.5);
    setZoomLevel(newZoom);
    if (newZoom === 1) {
      setPanPosition({ x: 0, y: 0 });
    }
  }, [zoomLevel, stopSlideshow]);

  const handleResetZoom = useCallback(() => {
    stopSlideshow();
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  }, [stopSlideshow]);

  const handleDownload = useCallback(() => {
    if (media) {
      window.open(media.file_url, "_blank");
    }
  }, [media]);

  const handlePrevious = useCallback(() => {
    setSlideshowActive(false);
    onPrevious?.();
  }, [onPrevious]);

  const handleNext = useCallback(() => {
    setSlideshowActive(false);
    onNext?.();
  }, [onNext]);

  if (!media) return null;

  const isImage = media.media_type === "image";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        ref={dialogRef}
        hideDefaultClose
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

        <LightboxHeader
          media={media}
          pdvName={pdvName}
          isImage={isImage}
          hasNext={hasNext}
          slideshowActive={slideshowActive}
          slideshowInterval={slideshowInterval}
          isFullscreen={isFullscreen}
          onToggleSlideshow={() => setSlideshowActive(prev => !prev)}
          onIntervalChange={setSlideshowInterval}
          onToggleFullscreen={toggleFullscreen}
          onClose={onClose}
        />

        <LightboxNavigation
          hasPrevious={hasPrevious}
          hasNext={hasNext}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />

        <LightboxContent
          media={media}
          zoomLevel={zoomLevel}
          panPosition={panPosition}
          onZoomChange={setZoomLevel}
          onPanChange={setPanPosition}
          onStopSlideshow={stopSlideshow}
          swipeOffset={swipeOffset}
          isSwiping={isSwiping}
          swipeHandlers={swipeHandlers}
        />

        {isImage && (
          <LightboxZoomControls
            zoomLevel={zoomLevel}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetZoom={handleResetZoom}
          />
        )}

        <LightboxFooter
          media={media}
          currentIndex={currentIndex}
          totalCount={totalCount}
          onDownload={handleDownload}
        />
      </DialogContent>
    </Dialog>
  );
}
