import { X, Maximize2, Minimize2, PlayCircle, PauseCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MarketingMedia, SLIDESHOW_INTERVALS } from "./types";
import { getMediaTypeIcon, getMediaTypeLabel } from "./utils";

interface LightboxHeaderProps {
  media: MarketingMedia;
  pdvName?: string;
  isImage: boolean;
  hasNext: boolean;
  slideshowActive: boolean;
  slideshowInterval: number;
  isFullscreen: boolean;
  onToggleSlideshow: () => void;
  onIntervalChange: (interval: number) => void;
  onToggleFullscreen: () => void;
  onClose: () => void;
}

export function LightboxHeader({
  media,
  pdvName,
  isImage,
  hasNext,
  slideshowActive,
  slideshowInterval,
  isFullscreen,
  onToggleSlideshow,
  onIntervalChange,
  onToggleFullscreen,
  onClose,
}: LightboxHeaderProps) {
  const TypeIcon = getMediaTypeIcon(media.media_type);

  return (
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
              onClick={onToggleSlideshow}
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
              onValueChange={(v) => onIntervalChange(parseInt(v))}
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
          onClick={onToggleFullscreen}
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
  );
}
