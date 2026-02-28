import { createContext, useContext, useEffect, useMemo, useCallback, ReactNode } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useUserOrganizations, AccessibleOrganization } from "@/hooks/useUserOrganizations";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";

interface ActiveOrgContextType {
  /** ID da organização atualmente selecionada, ou "all" para todas */
  activeOrgId: string | null;
  /** Trocar para outra organização */
  setActiveOrgId: (orgId: string) => void;
  /** Se a org ativa é a própria do usuário (owner) */
  isOwnOrg: boolean;
  /** Se a org ativa é somente leitura (viewer) */
  isReadOnly: boolean;
  /** Se "Todas as organizações" está selecionado */
  isAllOrgs: boolean;
  /** Lista de organizações acessíveis */
  organizations: AccessibleOrganization[];
  /** Se o usuário tem acesso a múltiplas organizações */
  hasMultipleOrgs: boolean;
  /** Nome da organização ativa */
  activeOrgName: string | null;
}

const ActiveOrgContext = createContext<ActiveOrgContextType | undefined>(undefined);

export function ActiveOrgProvider({ children }: { children: ReactNode }) {
  const { profile, role } = useProfile();
  const isSuperAdmin = role === "super_admin";
  const { organizations, hasMultipleOrgs } = useUserOrganizations();
  const [activeOrgId, setActiveOrgIdRaw] = useLocalStorageState<string | null>("active-org-id", null);

  // Initialize: super_admins default to "all", others to own org
  useEffect(() => {
    if (!activeOrgId) {
      if (isSuperAdmin) {
        setActiveOrgIdRaw("all");
      } else if (profile?.organization_id) {
        setActiveOrgIdRaw(profile.organization_id);
      }
    }
  }, [profile?.organization_id, activeOrgId, setActiveOrgIdRaw, isSuperAdmin]);

  // Validate saved org is still accessible (skip validation for "all")
  useEffect(() => {
    if (activeOrgId && activeOrgId !== "all" && organizations.length > 0 && !organizations.some(o => o.id === activeOrgId)) {
      if (isSuperAdmin) {
        setActiveOrgIdRaw("all");
      } else if (profile?.organization_id) {
        setActiveOrgIdRaw(profile.organization_id);
      }
    }
  }, [activeOrgId, organizations, profile?.organization_id, setActiveOrgIdRaw, isSuperAdmin]);

  const setActiveOrgId = useCallback((orgId: string) => {
    setActiveOrgIdRaw(orgId);
  }, [setActiveOrgIdRaw]);

  const isAllOrgs = activeOrgId === "all";
  const activeOrg = useMemo(() => organizations.find(o => o.id === activeOrgId), [organizations, activeOrgId]);
  const isOwnOrg = isAllOrgs || activeOrgId === profile?.organization_id;
  const isReadOnly = !isAllOrgs && activeOrg?.accessLevel === "viewer";

  const value = useMemo(() => ({
    activeOrgId,
    setActiveOrgId,
    isOwnOrg,
    isReadOnly,
    isAllOrgs,
    organizations,
    hasMultipleOrgs: hasMultipleOrgs || isSuperAdmin,
    activeOrgName: isAllOrgs ? "Todas as organizações" : (activeOrg?.name ?? null),
  }), [activeOrgId, setActiveOrgId, isOwnOrg, isReadOnly, isAllOrgs, organizations, hasMultipleOrgs, isSuperAdmin, activeOrg?.name]);

  return (
    <ActiveOrgContext.Provider value={value}>
      {children}
    </ActiveOrgContext.Provider>
  );
}

export function useActiveOrg() {
  const ctx = useContext(ActiveOrgContext);
  if (!ctx) throw new Error("useActiveOrg must be used within ActiveOrgProvider");
  return ctx;
}
