import { lazy, Suspense, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { User, Settings as SettingsIcon, Building2, Plug, Loader2, MapPin, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useOrganization } from "@/hooks/useOrganization";
import { usePreferences } from "@/hooks/usePreferences";
import { usePDVs } from "@/hooks/usePDVs";
import { TabSkeleton } from "@/components/settings";
import { cn } from "@/lib/utils";

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

  const tabs = [
    { value: "profile", label: "Perfil", icon: User, show: true },
    { value: "preferences", label: "Preferências", icon: SettingsIcon, show: true },
    { value: "organization", label: "Organização", icon: Building2, show: true },
    { value: "pdvs", label: "PDVs", icon: MapPin, show: true },
    { value: "team", label: "Equipe", icon: Users, show: isAdmin },
    { value: "integrations", label: "Integrações", icon: Plug, show: true },
  ].filter((t) => t.show);

  return (
    <AppLayout>
      <div className="ds-screen-enter space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie suas preferências e dados da organização
          </p>
        </div>

        {/* Layout: sidebar + content */}
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-5 items-start">
          <nav className="bg-card border border-border rounded-[var(--radius)] p-2 flex flex-row md:flex-col gap-0.5 flex-wrap">
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => handleTabChange(t.value)}
                  className={cn(
                    "flex items-center gap-2.5 w-full px-3 py-2.5 rounded-[8px] text-[13.5px] font-medium transition-colors text-left",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-foreground/70 hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="space-y-6 min-w-0">
            <Suspense fallback={<TabSkeleton />}>
              {activeTab === "profile" && (
                <ProfileSettings
                  profile={profile}
                  role={role}
                  session={session}
                  updateProfile={updateProfile}
                />
              )}
              {activeTab === "preferences" && (
                <PreferencesSettings
                  preferences={preferences}
                  pdvs={pdvs}
                  updatePreferences={updatePreferences}
                />
              )}
              {activeTab === "organization" && organization && (
                <OrganizationSettings
                  organization={organization}
                  isAdmin={isAdmin}
                  updateOrganization={updateOrganization}
                />
              )}
              {activeTab === "pdvs" && <PDVsSettings />}
              {activeTab === "team" && isAdmin && <TeamSettings />}
              {activeTab === "integrations" && <IntegrationsSettings />}
            </Suspense>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
