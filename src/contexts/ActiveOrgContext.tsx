import { createContext, useContext, useEffect, ReactNode } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useUserOrganizations, AccessibleOrganization } from "@/hooks/useUserOrganizations";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";

interface ActiveOrgContextType {
  /** ID da organização atualmente selecionada */
  activeOrgId: string | null;
  /** Trocar para outra organização */
  setActiveOrgId: (orgId: string) => void;
  /** Se a org ativa é a própria do usuário (owner) */
  isOwnOrg: boolean;
  /** Se a org ativa é somente leitura (viewer) */
  isReadOnly: boolean;
  /** Lista de organizações acessíveis */
  organizations: AccessibleOrganization[];
  /** Se o usuário tem acesso a múltiplas organizações */
  hasMultipleOrgs: boolean;
  /** Nome da organização ativa */
  activeOrgName: string | null;
}

const ActiveOrgContext = createContext<ActiveOrgContextType | undefined>(undefined);

export function ActiveOrgProvider({ children }: { children: ReactNode }) {
  const { profile } = useProfile();
  const { organizations, hasMultipleOrgs } = useUserOrganizations();
  const [activeOrgId, setActiveOrgIdRaw] = useLocalStorageState<string | null>("active-org-id", null);

  // Initialize with user's own org
  useEffect(() => {
    if (!activeOrgId && profile?.organization_id) {
      setActiveOrgIdRaw(profile.organization_id);
    }
  }, [profile?.organization_id, activeOrgId, setActiveOrgIdRaw]);

  // Validate saved org is still accessible
  useEffect(() => {
    if (activeOrgId && organizations.length > 0 && !organizations.some(o => o.id === activeOrgId)) {
      // Saved org no longer accessible, reset to own org
      if (profile?.organization_id) {
        setActiveOrgIdRaw(profile.organization_id);
      }
    }
  }, [activeOrgId, organizations, profile?.organization_id, setActiveOrgIdRaw]);

  const setActiveOrgId = (orgId: string) => {
    setActiveOrgIdRaw(orgId);
  };

  const activeOrg = organizations.find(o => o.id === activeOrgId);
  const isOwnOrg = activeOrgId === profile?.organization_id;
  const isReadOnly = activeOrg?.accessLevel === "viewer";

  return (
    <ActiveOrgContext.Provider
      value={{
        activeOrgId,
        setActiveOrgId,
        isOwnOrg,
        isReadOnly,
        organizations,
        hasMultipleOrgs,
        activeOrgName: activeOrg?.name ?? null,
      }}
    >
      {children}
    </ActiveOrgContext.Provider>
  );
}

export function useActiveOrg() {
  const ctx = useContext(ActiveOrgContext);
  if (!ctx) throw new Error("useActiveOrg must be used within ActiveOrgProvider");
  return ctx;
}
