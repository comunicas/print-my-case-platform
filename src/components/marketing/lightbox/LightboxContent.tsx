import { MarketingMedia, SwipeHandlers } from "./types";
import { LightboxImageViewer } from "./LightboxImageViewer";
import { LightboxAudioPlayer } from "./LightboxAudioPlayer";

interface LightboxContentProps {
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

export function LightboxContent({
  media,
  zoomLevel,
  panPosition,
  onZoomChange,
  onPanChange,
  onStopSlideshow,
  swipeOffset,
  isSwiping,
  swipeHandlers,
}: LightboxContentProps) {
  return (
    <div className="flex items-center justify-center w-full h-full p-16">
      {media.media_type === "image" && (
        <LightboxImageViewer
          media={media}
          zoomLevel={zoomLevel}
          panPosition={panPosition}
          onZoomChange={onZoomChange}
          onPanChange={onPanChange}
          onStopSlideshow={onStopSlideshow}
          swipeOffset={swipeOffset}
          isSwiping={isSwiping}
          swipeHandlers={swipeHandlers}
        />
      )}

      {media.media_type === "video" && (
        <video
          src={media.file_url}
          controls
          className="max-w-full max-h-full rounded-lg"
        />
      )}

      {media.media_type === "audio" && (
        <LightboxAudioPlayer media={media} />
      )}
    </div>
  );
}
