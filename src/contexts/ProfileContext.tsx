import {
  createContext,
  useContext,
  useMemo,
  ReactNode,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  organization_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  status: "active" | "pending" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: "super_admin" | "org_admin" | "operator" | "viewer";
}

type AppRole = UserRole["role"];

interface ProfileDataContextValue {
  profile: Profile | null | undefined;
  isLoading: boolean;
  error: Error | null;
  updateProfile: ReturnType<typeof useMutation<Profile, Error, Partial<Profile>>>;
}

interface ProfileRoleContextValue {
  role: AppRole | undefined;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

// ── Contexts ───────────────────────────────────────────────────────────

const ProfileDataContext = createContext<ProfileDataContextValue | undefined>(undefined);
const ProfileRoleContext = createContext<ProfileRoleContextValue | undefined>(undefined);

// ── Provider ───────────────────────────────────────────────────────────

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const roleQuery = useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as UserRole | null;
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const updateProfile = useMutation<Profile, Error, Partial<Profile>>({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast.success("Perfil atualizado", {
        description: "Suas informações foram salvas com sucesso.",
      });
    },
    onError: (error) => {
      toast.error("Erro ao atualizar", { description: error.message });
    },
  });

  // Separate memoisation so consumers of role don't re-render when profile changes
  const roleValue = useMemo<ProfileRoleContextValue>(() => {
    const role = roleQuery.data?.role;
    return {
      role,
      isAdmin: role === "super_admin" || role === "org_admin",
      isSuperAdmin: role === "super_admin",
    };
  }, [roleQuery.data?.role]);

  const dataValue = useMemo<ProfileDataContextValue>(
    () => ({
      profile: profileQuery.data,
      isLoading: profileQuery.isLoading || roleQuery.isLoading,
      error: (profileQuery.error || roleQuery.error) as Error | null,
      updateProfile,
    }),
    [profileQuery.data, profileQuery.isLoading, profileQuery.error, roleQuery.isLoading, roleQuery.error, updateProfile],
  );

  return (
    <ProfileRoleContext.Provider value={roleValue}>
      <ProfileDataContext.Provider value={dataValue}>
        {children}
      </ProfileDataContext.Provider>
    </ProfileRoleContext.Provider>
  );
}

// ── Hooks ──────────────────────────────────────────────────────────────

/** Full profile data — triggers re-render on profile OR role change */
export function useProfileContext() {
  const data = useContext(ProfileDataContext);
  const role = useContext(ProfileRoleContext);
  if (!data || !role) {
    throw new Error("useProfileContext must be used within a ProfileProvider");
  }
  return {
    profile: data.profile,
    role: role.role,
    isLoading: data.isLoading,
    error: data.error,
    updateProfile: data.updateProfile,
    isAdmin: role.isAdmin,
  };
}

/** Role-only — does NOT re-render when profile (name, avatar, etc.) changes */
export function useRole() {
  const ctx = useContext(ProfileRoleContext);
  if (!ctx) {
    throw new Error("useRole must be used within a ProfileProvider");
  }
  return ctx;
}
