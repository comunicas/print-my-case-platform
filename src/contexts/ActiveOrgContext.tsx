import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useUserOrganizations, AccessibleOrganization } from "@/hooks/useUserOrganizations";

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
  const [activeOrgId, setActiveOrgIdState] = useState<string | null>(null);

  // Initialize with user's own org
  useEffect(() => {
    if (!activeOrgId && profile?.organization_id) {
      setActiveOrgIdState(profile.organization_id);
    }
  }, [profile?.organization_id, activeOrgId]);

  const setActiveOrgId = (orgId: string) => {
    setActiveOrgIdState(orgId);
    // Persist selection
    localStorage.setItem("active-org-id", orgId);
  };

  // Restore from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("active-org-id");
    if (saved && organizations.some(o => o.id === saved)) {
      setActiveOrgIdState(saved);
    }
  }, [organizations]);

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
