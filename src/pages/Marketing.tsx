import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrganization } from "@/hooks/useOrganization";
import { usePDVs } from "@/hooks/usePDVs";
import { useDefaultPdvPreference } from "@/hooks/useDefaultPdvPreference";
import { PDVFilter } from "@/components/ui/PDVFilter";
import { Loader2, QrCode, Image } from "lucide-react";
import { lazy, Suspense } from "react";
import { TabSkeleton } from "@/components/settings/TabSkeleton";

const CouponsSettings = lazy(() => import("@/components/marketing/CouponsSettings").then(m => ({ default: m.CouponsSettings })));
const MediaSettings = lazy(() => import("@/components/marketing/MediaSettings").then(m => ({ default: m.MediaSettings })));

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
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Marketing</h1>
            <p className="text-muted-foreground">
              Gerencie cupons e mídias para seus PDVs.
            </p>
          </div>
          <PDVFilter
            value={selectedPdvId}
            onChange={handlePdvChange}
            pdvs={pdvs}
            showAutoAppliedBadge={pdvWasAutoApplied}
          />
        </div>

        <Tabs defaultValue="cupons" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="cupons" className="gap-2">
              <QrCode className="h-4 w-4" />
              Cupons
            </TabsTrigger>
            <TabsTrigger value="midia" className="gap-2">
              <Image className="h-4 w-4" />
              Mídia
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cupons" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Códigos e QR Codes</CardTitle>
                <CardDescription>
                  Configure códigos promocionais e QR Codes para cada PDV do catálogo público.
                </CardDescription>
              </CardHeader>
              <CardContent>
              <Suspense fallback={<TabSkeleton />}>
                  <CouponsSettings organizationId={organization.id} selectedPdvId={selectedPdvId} />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="midia" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Imagens, Vídeos e Áudios</CardTitle>
                <CardDescription>
                  Adicione imagens, vídeos e áudios para download no catálogo público.
                </CardDescription>
              </CardHeader>
              <CardContent>
              <Suspense fallback={<TabSkeleton />}>
                  <MediaSettings organizationId={organization.id} selectedPdvId={selectedPdvId} />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
