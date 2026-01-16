import { AppLayout } from "@/components/layout/AppLayout";
import { PDVFilter } from "@/components/ui/PDVFilter";
import { useVitrineMedia } from "@/hooks/useVitrineMedia";
import { useOrganization } from "@/hooks/useOrganization";
import { usePDVs } from "@/hooks/usePDVs";
import { useDefaultPdvPreference } from "@/hooks/useDefaultPdvPreference";
import { VitrineMediaCard } from "@/components/vitrine/VitrineMediaCard";
import { Loader2, Download, Image } from "lucide-react";

export default function Vitrine() {
  const { organization, isLoading: orgLoading } = useOrganization();
  const { pdvs, isLoading: pdvsLoading } = usePDVs({ organizationId: organization?.id });
  const { selectedPdvId, setSelectedPdvId, wasAutoApplied } = useDefaultPdvPreference({ pdvs, isLoading: pdvsLoading });
  const { media, isLoading: mediaLoading } = useVitrineMedia(selectedPdvId);

  const isLoading = orgLoading || pdvsLoading || mediaLoading;

  if (orgLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!organization) {
    return (
      <AppLayout>
        <div className="text-center py-8 text-muted-foreground">
          Organização não encontrada.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Download className="h-6 w-6" />
              Vitrine de Mídias
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualize e baixe as mídias disponíveis para seus PDVs.
            </p>
          </div>
          <PDVFilter
            value={selectedPdvId}
            onChange={setSelectedPdvId}
            pdvs={pdvs}
            showAutoAppliedBadge={wasAutoApplied}
          />
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : media.length === 0 ? (
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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {media.map((item) => (
              <VitrineMediaCard key={item.id} media={item} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
