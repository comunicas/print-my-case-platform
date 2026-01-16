import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrganization } from "@/hooks/useOrganization";
import { usePDVs } from "@/hooks/usePDVs";
import { useDefaultPdvPreference } from "@/hooks/useDefaultPdvPreference";
import { PDVFilter } from "@/components/ui/PDVFilter";
import { Loader2 } from "lucide-react";
import { lazy, Suspense } from "react";
import { TabSkeleton } from "@/components/settings/TabSkeleton";

const CouponsSettings = lazy(() => import("@/components/marketing/CouponsSettings").then(m => ({ default: m.CouponsSettings })));

export default function Marketing() {
  const { organization, isLoading: orgLoading } = useOrganization();
  const { pdvs = [], isLoading: pdvsLoading } = usePDVs();
  
  const { 
    selectedPdvId, 
    setSelectedPdvId: handlePdvChange, 
    wasAutoApplied: pdvWasAutoApplied 
  } = useDefaultPdvPreference({ pdvs, isLoading: pdvsLoading });

  const isLoading = orgLoading || pdvsLoading;

  if (isLoading) {
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
        <div className="text-center py-16 text-muted-foreground">
          Organização não encontrada.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Cupons</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Configure códigos promocionais e QR Codes para seus PDVs.
            </p>
          </div>
          <PDVFilter
            value={selectedPdvId}
            onChange={handlePdvChange}
            pdvs={pdvs}
            showAutoAppliedBadge={pdvWasAutoApplied}
          />
        </div>

        <Suspense fallback={<TabSkeleton />}>
          <CouponsSettings organizationId={organization.id} selectedPdvId={selectedPdvId} />
        </Suspense>
      </div>
    </AppLayout>
  );
}
