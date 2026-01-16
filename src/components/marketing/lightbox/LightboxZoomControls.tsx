import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface LightboxZoomControlsProps {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

export function LightboxZoomControls({
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}: LightboxZoomControlsProps) {
  return (
    <div className="absolute bottom-20 right-4 z-10 flex items-center gap-1 bg-background/80 rounded-lg p-1 backdrop-blur-sm">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onZoomOut}
        disabled={zoomLevel <= 1}
        className="h-8 w-8"
        aria-label="Diminuir zoom"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Badge variant="secondary" className="min-w-[3rem] justify-center">
        {zoomLevel.toFixed(1)}x
      </Badge>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onZoomIn}
        disabled={zoomLevel >= 4}
        className="h-8 w-8"
        aria-label="Aumentar zoom"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      {zoomLevel > 1 && (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onResetZoom}
          className="h-8 w-8"
          aria-label="Resetar zoom"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
