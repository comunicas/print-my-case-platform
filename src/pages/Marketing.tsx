import { AppLayout } from "@/components/layout/AppLayout";
import { useOrganization } from "@/hooks/useOrganization";
import { usePDVs } from "@/hooks/usePDVs";
import { useDefaultPdvPreference } from "@/hooks/useDefaultPdvPreference";
import { PDVFilter } from "@/components/ui/PDVFilter";
import { Loader2 } from "lucide-react";
import { lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { TabSkeleton } from "@/components/settings/TabSkeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CouponsSettings = lazy(() => import("@/components/marketing/CouponsSettings").then(m => ({ default: m.CouponsSettings })));
const VitrineContent = lazy(() => import("@/components/marketing/VitrineContent").then(m => ({ default: m.VitrineContent })));

export default function Marketing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "cupons";
  
  const { organization, isLoading: orgLoading } = useOrganization();
  const { pdvs = [], isLoading: pdvsLoading } = usePDVs();
  
  const { 
    selectedPdvId, 
    setSelectedPdvId: handlePdvChange, 
    wasAutoApplied: pdvWasAutoApplied 
  } = useDefaultPdvPreference({ pdvs, isLoading: pdvsLoading });

  const isLoading = orgLoading || pdvsLoading;

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

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
            <h1 className="text-xl md:text-2xl font-bold">Marketing</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Gerencie cupons e mídias promocionais dos seus PDVs.
            </p>
          </div>
          <PDVFilter
            value={selectedPdvId}
            onChange={handlePdvChange}
            pdvs={pdvs}
            showAutoAppliedBadge={pdvWasAutoApplied}
          />
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="cupons">Cupons</TabsTrigger>
            <TabsTrigger value="midias">Mídias</TabsTrigger>
          </TabsList>

          <TabsContent value="cupons" className="mt-4">
            <Suspense fallback={<TabSkeleton />}>
              <CouponsSettings organizationId={organization.id} selectedPdvId={selectedPdvId} />
            </Suspense>
          </TabsContent>

          <TabsContent value="midias" className="mt-4">
            <Suspense fallback={<TabSkeleton />}>
              <VitrineContent selectedPdvId={selectedPdvId} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
