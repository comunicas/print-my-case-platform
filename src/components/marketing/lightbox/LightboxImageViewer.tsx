import { useCallback, useRef, useState } from "react";
import { MarketingMedia, SwipeHandlers } from "./types";
import { getTouchDistance } from "./utils";

interface LightboxImageViewerProps {
  media: MarketingMedia;
  zoomLevel: number;
  panPosition: { x: number; y: number };
  onZoomChange: (level: number) => void;
  onPanChange: (position: { x: number; y: number }) => void;
  onStopSlideshow: () => void;
  swipeOffset: number;
  isSwiping: boolean;
  swipeHandlers: SwipeHandlers;
}

export function LightboxImageViewer({
  media,
  zoomLevel,
  panPosition,
  onZoomChange,
  onPanChange,
  onStopSlideshow,
  swipeOffset,
  isSwiping,
  swipeHandlers,
}: LightboxImageViewerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPinchDistance, setInitialPinchDistance] = useState(0);
  const [initialZoom, setInitialZoom] = useState(1);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Zoom handlers
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    onStopSlideshow();
    
    const delta = e.deltaY > 0 ? -0.25 : 0.25;
    const newZoom = Math.min(4, Math.max(1, zoomLevel + delta));
    onZoomChange(newZoom);
    
    if (newZoom === 1) {
      onPanChange({ x: 0, y: 0 });
    }
  }, [zoomLevel, onZoomChange, onPanChange, onStopSlideshow]);

  const handleDoubleClick = useCallback(() => {
    onStopSlideshow();
    
    if (zoomLevel > 1) {
      onZoomChange(1);
      onPanChange({ x: 0, y: 0 });
    } else {
      onZoomChange(2);
    }
  }, [zoomLevel, onZoomChange, onPanChange, onStopSlideshow]);

  // Pan/drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
  }, [zoomLevel, panPosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    const maxPan = (zoomLevel - 1) * 150;
    onPanChange({
      x: Math.max(-maxPan, Math.min(maxPan, newX)),
      y: Math.max(-maxPan, Math.min(maxPan, newY)),
    });
  }, [isDragging, dragStart, zoomLevel, onPanChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch handlers for pinch-to-zoom
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      onStopSlideshow();
      const distance = getTouchDistance(e.touches[0], e.touches[1]);
      setInitialPinchDistance(distance);
      setInitialZoom(zoomLevel);
    } else if (e.touches.length === 1) {
      if (zoomLevel > 1) {
        setIsDragging(true);
        setDragStart({ 
          x: e.touches[0].clientX - panPosition.x, 
          y: e.touches[0].clientY - panPosition.y 
        });
      } else {
        swipeHandlers.onTouchStart(e);
      }
    }
  }, [zoomLevel, panPosition, onStopSlideshow, swipeHandlers]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistance > 0) {
      e.preventDefault();
      const distance = getTouchDistance(e.touches[0], e.touches[1]);
      const scale = distance / initialPinchDistance;
      const newZoom = Math.min(4, Math.max(1, initialZoom * scale));
      onZoomChange(newZoom);
      
      if (newZoom === 1) {
        onPanChange({ x: 0, y: 0 });
      }
    } else if (e.touches.length === 1) {
      if (isDragging && zoomLevel > 1) {
        const newX = e.touches[0].clientX - dragStart.x;
        const newY = e.touches[0].clientY - dragStart.y;
        
        const maxPan = (zoomLevel - 1) * 150;
        onPanChange({
          x: Math.max(-maxPan, Math.min(maxPan, newX)),
          y: Math.max(-maxPan, Math.min(maxPan, newY)),
        });
      } else if (zoomLevel === 1) {
        swipeHandlers.onTouchMove(e);
      }
    }
  }, [initialPinchDistance, initialZoom, isDragging, dragStart, zoomLevel, onZoomChange, onPanChange, swipeHandlers]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setInitialPinchDistance(0);
    swipeHandlers.onTouchEnd();
  }, [swipeHandlers]);

  return (
    <div
      ref={imageContainerRef}
      className={`relative overflow-hidden ${zoomLevel > 1 ? 'cursor-grab' : 'cursor-zoom-in'} ${isDragging ? 'cursor-grabbing' : ''}`}
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
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
  );
}
