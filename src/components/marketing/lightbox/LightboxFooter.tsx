import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingMedia } from "./types";
import { formatFileSize } from "./utils";

interface LightboxFooterProps {
  media: MarketingMedia;
  currentIndex?: number;
  totalCount?: number;
  onDownload: () => void;
}

export function LightboxFooter({
  media,
  currentIndex,
  totalCount,
  onDownload,
}: LightboxFooterProps) {
  return (
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
      <Button variant="secondary" size="sm" onClick={onDownload}>
        <Download className="h-4 w-4 mr-2" />
        Baixar
      </Button>
    </div>
  );
}
