import { AppLayout } from "@/components/layout/AppLayout";
import { useActiveOrg } from "@/contexts/ActiveOrgContext";
import { usePDVs } from "@/hooks/usePDVs";
import { useDefaultPdvPreference } from "@/hooks/useDefaultPdvPreference";
import { useProfile } from "@/hooks/useProfile";
import { PDVFilter } from "@/components/ui/PDVFilter";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { TabSkeleton } from "@/components/settings/TabSkeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CouponsSettings = lazy(() => import("@/components/marketing/CouponsSettings").then(m => ({ default: m.CouponsSettings })));
const MarketingOverview = lazy(() => import("@/components/marketing/MarketingOverview").then(m => ({ default: m.MarketingOverview })));
const MediaSettings = lazy(() => import("@/components/marketing/MediaSettings").then(m => ({ default: m.MediaSettings })));
const CatalogLeadsSettings = lazy(() => import("@/components/marketing/CatalogLeadsSettings").then(m => ({ default: m.CatalogLeadsSettings })));
const MarketingAnalytics = lazy(() => import("@/components/marketing/MarketingAnalytics").then(m => ({ default: m.MarketingAnalytics })));
const ProductRequestsSettings = lazy(() => import("@/components/marketing/ProductRequestsSettings").then(m => ({ default: m.ProductRequestsSettings })));
const PDVCatalogList = lazy(() => import("@/components/marketing/PDVCatalogList").then(m => ({ default: m.PDVCatalogList })));

export default function Marketing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab");
  
  const { activeOrgId } = useActiveOrg();
  const effectiveOrgId = activeOrgId === "all" ? undefined : activeOrgId ?? undefined;
  
  const { pdvs = [], isLoading: pdvsLoading } = usePDVs();
  const { role, isAdmin } = useProfile();
  
  const { 
    selectedPdvId, 
    setSelectedPdvId: handlePdvChange, 
    wasAutoApplied: pdvWasAutoApplied 
  } = useDefaultPdvPreference({ pdvs, isLoading: pdvsLoading });

  const isLoading = pdvsLoading;
  const isSuperAdmin = role === "super_admin";

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

  // Show overview when no tab is selected
  if (!activeTab) {
    return (
      <AppLayout>
        <div className="space-y-4 md:space-y-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Marketing</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Gerencie cupons e mídias promocionais dos seus PDVs.
            </p>
          </div>
          <Suspense fallback={<TabSkeleton />}>
            <MarketingOverview onNavigate={handleTabChange} isAdmin={isAdmin} />
          </Suspense>
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
            {isAdmin && <TabsTrigger value="catalogos">Catálogos</TabsTrigger>}
            {isAdmin && <TabsTrigger value="pedidos">Pedidos</TabsTrigger>}
            {isAdmin && <TabsTrigger value="leads">Leads</TabsTrigger>}
            {isAdmin && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
          </TabsList>

          <TabsContent value="cupons" className="mt-4">
            <Suspense fallback={<TabSkeleton />}>
              <CouponsSettings organizationId={effectiveOrgId} selectedPdvId={selectedPdvId} isAdmin={isAdmin} />
            </Suspense>
          </TabsContent>

          <TabsContent value="midias" className="mt-4">
            <Suspense fallback={<TabSkeleton />}>
              <div className="space-y-4">
                {isSuperAdmin && (
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">Gerenciar Mídias</h2>
                    <Badge variant="secondary">Super Admin</Badge>
                  </div>
                )}
                {!isSuperAdmin && (
                  <h2 className="text-lg font-semibold">Mídias Disponíveis</h2>
                )}
                <MediaSettings 
                  organizationId={effectiveOrgId} 
                  selectedPdvId={selectedPdvId}
                  isAdmin={isSuperAdmin}
                />
              </div>
            </Suspense>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="catalogos" className="mt-4">
              <Suspense fallback={<TabSkeleton />}>
                <PDVCatalogList organizationId={effectiveOrgId} />
              </Suspense>
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="pedidos" className="mt-4">
              <Suspense fallback={<TabSkeleton />}>
                <ProductRequestsSettings />
              </Suspense>
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="leads" className="mt-4">
              <Suspense fallback={<TabSkeleton />}>
                <CatalogLeadsSettings />
              </Suspense>
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="analytics" className="mt-4">
              <Suspense fallback={<TabSkeleton />}>
                <MarketingAnalytics selectedPdvId={selectedPdvId} />
              </Suspense>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AppLayout>
  );
}