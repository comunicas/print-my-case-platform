import { lazy, Suspense, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { User, Settings as SettingsIcon, Building2, Plug, ExternalLink, Cloud, Loader2, MapPin, Users, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useOrganization } from "@/hooks/useOrganization";
import { usePreferences } from "@/hooks/usePreferences";
import { usePDVs } from "@/hooks/usePDVs";
import { TabSkeleton } from "@/components/settings";

// Lazy load das tabs de settings
const ProfileSettings = lazy(() => import("@/components/settings/ProfileSettings").then(m => ({ default: m.ProfileSettings })));
const PreferencesSettings = lazy(() => import("@/components/settings/PreferencesSettings").then(m => ({ default: m.PreferencesSettings })));
const OrganizationSettings = lazy(() => import("@/components/settings/OrganizationSettings").then(m => ({ default: m.OrganizationSettings })));
const PDVsSettings = lazy(() => import("@/components/settings/PDVsSettings").then(m => ({ default: m.PDVsSettings })));
const TeamSettings = lazy(() => import("@/components/settings/TeamSettings").then(m => ({ default: m.TeamSettings })));
const IntegrationsSettings = lazy(() => import("@/components/settings/IntegrationsSettings").then(m => ({ default: m.IntegrationsSettings })));
const ProductRequestsSettings = lazy(() => import("@/components/settings/ProductRequestsSettings").then(m => ({ default: m.ProductRequestsSettings })));


// Abas restritas apenas para admins
const ADMIN_ONLY_TABS = ["team", "requests"];

export default function Settings() {
const [searchParams, setSearchParams] = useSearchParams();
  const { session } = useAuth();
  const { profile, role, isAdmin, isLoading: profileLoading, updateProfile } = useProfile();
  const { organization, isLoading: orgLoading, updateOrganization } = useOrganization({ readOnly: true });
  const { preferences, isLoading: prefsLoading, updatePreferences } = usePreferences();
  const { pdvs, isLoading: pdvsLoading } = usePDVs({ organizationId: profile?.organization_id ?? undefined });
  
  // Sincronizar tab com URL
  const activeTab = searchParams.get("tab") || "profile";
  
  // Redirecionar não-admins de abas restritas para perfil
  useEffect(() => {
    if (!isAdmin && ADMIN_ONLY_TABS.includes(activeTab)) {
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.set("tab", "profile");
        return newParams;
      });
    }
  }, [activeTab, isAdmin, setSearchParams]);
  
  const handleTabChange = (value: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set("tab", value);
      return newParams;
    });
  };

  const isLoading = profileLoading || orgLoading || prefsLoading;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie suas preferências e dados da organização
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-7 h-auto">
            <TabsTrigger value="profile" className="gap-2 py-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2 py-2">
              <SettingsIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Preferências</span>
            </TabsTrigger>
            <TabsTrigger value="organization" className="gap-2 py-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Organização</span>
            </TabsTrigger>
            <TabsTrigger value="pdvs" className="gap-2 py-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">PDVs</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="requests" className="gap-2 py-2">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Pedidos</span>
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="team" className="gap-2 py-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Equipe</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="integrations" className="gap-2 py-2">
              <Plug className="h-4 w-4" />
              <span className="hidden sm:inline">Integrações</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Suspense fallback={<TabSkeleton />}>
              <ProfileSettings
                profile={profile}
                role={role}
                session={session}
                updateProfile={updateProfile}
              />
            </Suspense>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Suspense fallback={<TabSkeleton />}>
              <PreferencesSettings
                preferences={preferences}
                pdvs={pdvs}
                updatePreferences={updatePreferences}
              />
            </Suspense>
          </TabsContent>

          {/* Organization Tab */}
          <TabsContent value="organization" className="space-y-6">
            {organization && (
              <Suspense fallback={<TabSkeleton />}>
                <OrganizationSettings
                  organization={organization}
                  isAdmin={isAdmin}
                  updateOrganization={updateOrganization}
                />
              </Suspense>
            )}

            {/* Plan & Billing */}
            <Card>
              <CardHeader>
                <CardTitle>Plano e Faturamento</CardTitle>
                <CardDescription>
                  Gerencie seu plano e informações de cobrança
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Plano atual:</span>
                      <Badge>{organization?.plan || "Gratuito"}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {organization?.active_since 
                        ? `Ativo desde: ${new Date(organization.active_since).toLocaleDateString("pt-BR")}` 
                        : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" disabled className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Gerenciar Plano
                  </Button>
                  <Button variant="outline" disabled className="gap-2">
                    Ver Faturas
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Active PDVs */}
            <Card>
              <CardHeader>
                <CardTitle>PDVs Ativos</CardTitle>
                <CardDescription>
                  Pontos de venda vinculados à sua organização
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pdvsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : pdvs.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    Nenhum PDV cadastrado.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {pdvs.filter(p => p.status === "active").slice(0, 5).map((pdv) => (
                      <div
                        key={pdv.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div>
                          <p className="font-medium">{pdv.name}</p>
                          <p className="text-sm text-muted-foreground">{pdv.machine_id}</p>
                        </div>
                        <Badge variant="secondary">Ativo</Badge>
                      </div>
                    ))}
                  </div>
                )}
                <Button variant="link" className="mt-4 px-0" onClick={() => handleTabChange("pdvs")}>
                  Ver todos os PDVs →
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PDVs Tab */}
          <TabsContent value="pdvs" className="space-y-6">
            <Suspense fallback={<TabSkeleton />}>
              <PDVsSettings />
            </Suspense>
          </TabsContent>

          {/* Product Requests Tab */}
          {isAdmin && (
            <TabsContent value="requests" className="space-y-6">
              <Suspense fallback={<TabSkeleton />}>
                <ProductRequestsSettings />
              </Suspense>
            </TabsContent>
          )}


          {/* Team Tab */}
          {isAdmin && (
            <TabsContent value="team" className="space-y-6">
              <Suspense fallback={<TabSkeleton />}>
                <TeamSettings />
              </Suspense>
            </TabsContent>
          )}

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <Suspense fallback={<TabSkeleton />}>
              <IntegrationsSettings />
            </Suspense>

            {/* Backend Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="h-5 w-5" />
                  Backend (Lovable Cloud)
                </CardTitle>
                <CardDescription>
                  Banco de dados para persistência de dados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500 hover:bg-green-600">Conectado</Badge>
                  </div>
                  <Button variant="outline" disabled className="gap-2">
                    Configurado
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
