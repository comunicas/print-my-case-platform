import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { toast } from "sonner";
import { PDVFormData, pdvFormSchema } from "@/lib/schemas/pdv";
import { CreateUserFormData } from "@/lib/schemas/user";

export interface OrgMember {
  id: string;
  name: string;
  email: string;
  status: string | null;
  role: string;
}

export interface OrgPDV {
  id: string;
  name: string;
  location: string;
  machine_id: string;
  status: string | null;
}

const EMPTY_PDV_FORM: PDVFormData = {
  name: "",
  location: "",
  machineId: "",
  status: "active",
};

function clearFieldError(
  setter: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  field: string,
) {
  setter((prev) => {
    const next = { ...prev };
    delete next[field];
    return next;
  });
}

function parseZodErrors(error: { errors: { path: (string | number)[]; message: string }[] }) {
  const fieldErrors: Record<string, string> = {};
  error.errors.forEach((e) => {
    if (e.path[0]) fieldErrors[e.path[0] as string] = e.message;
  });
  return fieldErrors;
}

export function useOrgDetailActions(
  organizationId: string,
  organizationName: string,
  open: boolean,
) {
  const queryClient = useQueryClient();
  const { organizations } = useOrganizations();
  const { createUser: createUserMutation } = useTeamMembers();

  // ── Queries ────────────────────────────────────────────────
  const membersQuery = useQuery({
    queryKey: ["org-detail-members", organizationId],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, name, email, status")
        .eq("organization_id", organizationId)
        .order("name");

      if (profilesError) throw profilesError;

      const profileIds = profiles.map((p) => p.id);
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", profileIds);

      if (rolesError) throw rolesError;

      const roleMap = new Map(roles.map((r) => [r.user_id, r.role]));

      return profiles.map((p) => ({
        ...p,
        role: roleMap.get(p.id) || "viewer",
      })) as OrgMember[];
    },
    enabled: open && !!organizationId,
  });

  const pdvsQuery = useQuery({
    queryKey: ["org-detail-pdvs", organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pdvs")
        .select("id, name, location, machine_id, status")
        .eq("organization_id", organizationId)
        .order("name");

      if (error) throw error;
      return data as OrgPDV[];
    },
    enabled: open && !!organizationId,
  });

  // ── Update Role ────────────────────────────────────────────
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);
      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole as "super_admin" | "org_admin" | "operator" | "viewer" });
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      toast.success("Função atualizada com sucesso");
      queryClient.invalidateQueries({ queryKey: ["org-detail-members", organizationId] });
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar função", { description: error.message });
    },
  });

  // ── Delete User ────────────────────────────────────────────
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteUserName, setDeleteUserName] = useState("");

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Usuário excluído com sucesso");
      queryClient.invalidateQueries({ queryKey: ["org-detail-members", organizationId] });
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      setDeleteUserId(null);
    },
    onError: (error: Error) => {
      toast.error("Erro ao excluir usuário", { description: error.message });
    },
  });

  // ── Delete PDV ─────────────────────────────────────────────
  const [deletePdvId, setDeletePdvId] = useState<string | null>(null);
  const [deletePdvName, setDeletePdvName] = useState("");

  const deletePdvMutation = useMutation({
    mutationFn: async (pdvId: string) => {
      const { error } = await supabase.from("pdvs").delete().eq("id", pdvId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("PDV excluído com sucesso");
      queryClient.invalidateQueries({ queryKey: ["org-detail-pdvs", organizationId] });
      queryClient.invalidateQueries({ queryKey: ["pdvs"] });
      setDeletePdvId(null);
    },
    onError: (error: Error) => {
      toast.error("Erro ao excluir PDV", { description: error.message });
    },
  });

  // ── Edit PDV ───────────────────────────────────────────────
  const [editPdv, setEditPdv] = useState<OrgPDV | null>(null);
  const [editForm, setEditForm] = useState<PDVFormData>(EMPTY_PDV_FORM);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [transferOrgId, setTransferOrgId] = useState("");
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);

  const editPdvMutation = useMutation({
    mutationFn: async ({ id, data, newOrgId }: { id: string; data: PDVFormData; newOrgId?: string }) => {
      const updatePayload: Record<string, unknown> = {
        name: data.name,
        location: data.location,
        status: data.status,
      };
      if (newOrgId && newOrgId !== organizationId) {
        updatePayload.organization_id = newOrgId;
      }
      const { error } = await supabase.from("pdvs").update(updatePayload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("PDV atualizado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["org-detail-pdvs", organizationId] });
      queryClient.invalidateQueries({ queryKey: ["pdvs"] });
      setEditPdv(null);
      setTransferOrgId("");
      setShowTransferConfirm(false);
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar PDV", { description: error.message });
    },
  });

  const handleEditPdvOpen = (pdv: OrgPDV) => {
    setEditPdv(pdv);
    setEditForm({
      name: pdv.name,
      location: pdv.location,
      machineId: pdv.machine_id,
      status: (pdv.status as "active" | "inactive") || "active",
    });
    setEditErrors({});
    setTransferOrgId("");
  };

  const handleEditPdvSave = () => {
    const result = pdvFormSchema.safeParse(editForm);
    if (!result.success) {
      setEditErrors(parseZodErrors(result.error));
      return;
    }
    if (transferOrgId && transferOrgId !== organizationId) {
      setShowTransferConfirm(true);
      return;
    }
    if (editPdv) {
      editPdvMutation.mutate({ id: editPdv.id, data: editForm });
    }
  };

  const handleConfirmTransfer = () => {
    if (editPdv) {
      editPdvMutation.mutate({ id: editPdv.id, data: editForm, newOrgId: transferOrgId });
    }
  };

  const handleEditPdvClose = () => {
    setEditPdv(null);
    setTransferOrgId("");
  };

  // ── Create PDV ─────────────────────────────────────────────
  const [showCreatePdv, setShowCreatePdv] = useState(false);
  const [createPdvForm, setCreatePdvForm] = useState<PDVFormData>(EMPTY_PDV_FORM);
  const [createPdvErrors, setCreatePdvErrors] = useState<Record<string, string>>({});

  const createPdvMutation = useMutation({
    mutationFn: async (data: PDVFormData) => {
      const { error } = await supabase.from("pdvs").insert({
        name: data.name,
        location: data.location,
        machine_id: data.machineId,
        status: data.status,
        organization_id: organizationId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("PDV criado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["org-detail-pdvs", organizationId] });
      queryClient.invalidateQueries({ queryKey: ["pdvs"] });
      setShowCreatePdv(false);
      setCreatePdvForm(EMPTY_PDV_FORM);
      setCreatePdvErrors({});
    },
    onError: (error: Error) => {
      toast.error("Erro ao criar PDV", { description: error.message });
    },
  });

  const handleCreatePdvSave = () => {
    const result = pdvFormSchema.safeParse(createPdvForm);
    if (!result.success) {
      setCreatePdvErrors(parseZodErrors(result.error));
      return;
    }
    createPdvMutation.mutate(createPdvForm);
  };

  const handleCreatePdvClose = (openState: boolean) => {
    setShowCreatePdv(openState);
    if (!openState) {
      setCreatePdvForm(EMPTY_PDV_FORM);
      setCreatePdvErrors({});
    }
  };

  // ── Create User ────────────────────────────────────────────
  const [showCreateUser, setShowCreateUser] = useState(false);

  const handleCreateUserSubmit = async (data: CreateUserFormData) => {
    await createUserMutation.mutateAsync(data);
    queryClient.invalidateQueries({ queryKey: ["org-detail-members", organizationId] });
    setShowCreateUser(false);
  };

  return {
    // Queries
    members: membersQuery.data,
    membersLoading: membersQuery.isLoading,
    pdvs: pdvsQuery.data,
    pdvsLoading: pdvsQuery.isLoading,
    organizations,

    // Role
    updateRole: updateRoleMutation.mutate,
    isUpdatingRole: updateRoleMutation.isPending,

    // Delete user
    deleteUser: {
      targetId: deleteUserId,
      targetName: deleteUserName,
      open: (id: string, name: string) => { setDeleteUserId(id); setDeleteUserName(name); },
      close: () => setDeleteUserId(null),
      confirm: () => deleteUserId && deleteUserMutation.mutate(deleteUserId),
      isPending: deleteUserMutation.isPending,
    },

    // Delete PDV
    deletePdv: {
      targetId: deletePdvId,
      targetName: deletePdvName,
      open: (id: string, name: string) => { setDeletePdvId(id); setDeletePdvName(name); },
      close: () => setDeletePdvId(null),
      confirm: () => deletePdvId && deletePdvMutation.mutate(deletePdvId),
      isPending: deletePdvMutation.isPending,
    },

    // Edit PDV
    editPdv: {
      isOpen: !!editPdv,
      form: editForm,
      errors: editErrors,
      transferOrgId,
      showTransferConfirm,
      open: handleEditPdvOpen,
      close: handleEditPdvClose,
      setForm: setEditForm,
      clearError: (field: string) => clearFieldError(setEditErrors, field),
      setTransferOrgId,
      setShowTransferConfirm,
      save: handleEditPdvSave,
      confirmTransfer: handleConfirmTransfer,
      isPending: editPdvMutation.isPending,
    },

    // Create user
    createUser: {
      isOpen: showCreateUser,
      open: () => setShowCreateUser(true),
      close: () => setShowCreateUser(false),
      submit: handleCreateUserSubmit,
      isPending: createUserMutation.isPending,
    },

    // Create PDV
    createPdv: {
      isOpen: showCreatePdv,
      form: createPdvForm,
      errors: createPdvErrors,
      open: () => setShowCreatePdv(true),
      close: handleCreatePdvClose,
      setForm: setCreatePdvForm,
      clearError: (field: string) => clearFieldError(setCreatePdvErrors, field),
      save: handleCreatePdvSave,
      isPending: createPdvMutation.isPending,
    },
  };
}
