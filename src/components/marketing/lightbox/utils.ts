import { Image, Video, Music } from "lucide-react";

export const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return "N/A";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const getMediaTypeIcon = (type: string) => {
  switch (type) {
    case "image": return Image;
    case "video": return Video;
    case "audio": return Music;
    default: return Image;
  }
};

export const getMediaTypeLabel = (type: string) => {
  switch (type) {
    case "image": return "Imagem";
    case "video": return "Vídeo";
    case "audio": return "Áudio";
    default: return type;
  }
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const getTouchDistance = (touch1: React.Touch, touch2: React.Touch): number => {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
};
