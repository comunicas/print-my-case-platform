import { useVitrineMedia } from "@/hooks/useVitrineMedia";
import { VitrineMediaCard } from "@/components/vitrine/VitrineMediaCard";
import { Loader2, Image } from "lucide-react";

interface VitrineContentProps {
  selectedPdvId: string;
}

export function VitrineContent({ selectedPdvId }: VitrineContentProps) {
  const { media, isLoading } = useVitrineMedia(selectedPdvId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (media.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Image className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground">
          Nenhuma mídia disponível
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {selectedPdvId && selectedPdvId !== "all"
            ? "Este PDV não possui mídias ativas no momento."
            : "Não há mídias ativas nos PDVs que você tem acesso."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {media.map((item) => (
        <VitrineMediaCard key={item.id} media={item} />
      ))}
    </div>
  );
}
