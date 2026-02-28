import { lazy, Suspense, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


import { User, Settings as SettingsIcon, Building2, Plug, Loader2, MapPin, Users } from "lucide-react";
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

// Abas restritas apenas para admins
const ADMIN_ONLY_TABS = ["team"];

export default function Settings() {
const [searchParams, setSearchParams] = useSearchParams();
  const { session } = useAuth();
  const { profile, role, isAdmin, isLoading: profileLoading, updateProfile } = useProfile();
  const { organization, isLoading: orgLoading, updateOrganization } = useOrganization({ readOnly: true });
  const { preferences, isLoading: prefsLoading, updatePreferences } = usePreferences();
  const { pdvs } = usePDVs();
  
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
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-6 h-auto">
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
          </TabsContent>

          {/* PDVs Tab */}
          <TabsContent value="pdvs" className="space-y-6">
            <Suspense fallback={<TabSkeleton />}>
              <PDVsSettings />
            </Suspense>
          </TabsContent>

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
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
