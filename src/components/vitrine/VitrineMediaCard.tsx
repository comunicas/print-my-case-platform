import { Download, Image, Video, Music, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { VitrineMedia } from "@/hooks/useVitrineMedia";

interface VitrineMediaCardProps {
  media: VitrineMedia;
}

const mediaTypeIcons = {
  image: Image,
  video: Video,
  audio: Music,
};

const mediaTypeLabels = {
  image: "Imagem",
  video: "Vídeo",
  audio: "Áudio",
};

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function VitrineMediaCard({ media }: VitrineMediaCardProps) {
  const Icon = mediaTypeIcons[media.media_type];

  const handleDownload = async () => {
    try {
      const response = await fetch(media.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      // Extrair extensão do tipo de mídia ou URL
      const extension = media.file_url.split(".").pop()?.split("?")[0] || "file";
      link.download = `${media.title}.${extension}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("Download iniciado", {
        description: `${media.title} está sendo baixado.`,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Erro no download", {
        description: "Não foi possível baixar o arquivo.",
      });
    }
  };

  const renderPreview = () => {
    switch (media.media_type) {
      case "image":
        return (
          <img
            src={media.file_url}
            alt={media.title}
            className="w-full h-48 object-cover rounded-t-lg"
          />
        );
      case "video":
        return (
          <video
            src={media.file_url}
            className="w-full h-48 object-cover rounded-t-lg"
            controls
            preload="metadata"
          />
        );
      case "audio":
        return (
          <div className="w-full h-48 bg-muted rounded-t-lg flex flex-col items-center justify-center gap-4 p-4">
            <Music className="h-16 w-16 text-muted-foreground" />
            <audio src={media.file_url} controls className="w-full" preload="metadata" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-shadow">
      {renderPreview()}
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-medium truncate" title={media.title}>
              {media.title}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{media.pdv_name}</span>
            </div>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1 shrink-0">
            <Icon className="h-3 w-3" />
            {mediaTypeLabels[media.media_type]}
          </Badge>
        </div>

        {media.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {media.description}
          </p>
        )}

        <div className="flex items-center justify-between pt-2">
          {media.file_size && (
            <span className="text-xs text-muted-foreground">
              {formatFileSize(media.file_size)}
            </span>
          )}
          <Button
            size="sm"
            onClick={handleDownload}
            className="ml-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
