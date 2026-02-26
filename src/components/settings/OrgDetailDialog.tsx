import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Users, Store, Mail, MapPin, Pencil, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getInitials } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { PDVForm } from "@/components/pdv/PDVForm";
import { PDVFormData, pdvFormSchema } from "@/lib/schemas/pdv";

interface OrgDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  organizationName: string;
}

interface OrgMember {
  id: string;
  name: string;
  email: string;
  status: string | null;
  role: string;
}

interface OrgPDV {
  id: string;
  name: string;
  location: string;
  machine_id: string;
  status: string | null;
}

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  org_admin: "Admin",
  operator: "Operador",
  viewer: "Visualizador",
};

export function OrgDetailDialog({
  open,
  onOpenChange,
  organizationId,
  organizationName,
}: OrgDetailDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("users");

  // Delete user state
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteUserName, setDeleteUserName] = useState("");

  // Delete PDV state
  const [deletePdvId, setDeletePdvId] = useState<string | null>(null);
  const [deletePdvName, setDeletePdvName] = useState("");

  // Edit PDV state
  const [editPdv, setEditPdv] = useState<OrgPDV | null>(null);
  const [editForm, setEditForm] = useState<PDVFormData>({
    name: "",
    location: "",
    machineId: "",
    status: "active",
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

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

  // Delete user mutation
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

  // Delete PDV mutation
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

  // Edit PDV mutation
  const editPdvMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PDVFormData }) => {
      const { error } = await supabase
        .from("pdvs")
        .update({
          name: data.name,
          location: data.location,
          machine_id: data.machineId,
          status: data.status,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("PDV atualizado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["org-detail-pdvs", organizationId] });
      queryClient.invalidateQueries({ queryKey: ["pdvs"] });
      setEditPdv(null);
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
  };

  const handleEditPdvSave = () => {
    const result = pdvFormSchema.safeParse(editForm);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        if (e.path[0]) fieldErrors[e.path[0] as string] = e.message;
      });
      setEditErrors(fieldErrors);
      return;
    }
    if (editPdv) {
      editPdvMutation.mutate({ id: editPdv.id, data: editForm });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {organizationName}
            </DialogTitle>
            <DialogDescription>Detalhes da organização</DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="users" className="flex-1 gap-1.5">
                <Users className="h-4 w-4" />
                Usuários ({membersQuery.data?.length ?? 0})
              </TabsTrigger>
              <TabsTrigger value="pdvs" className="flex-1 gap-1.5">
                <Store className="h-4 w-4" />
                PDVs ({pdvsQuery.data?.length ?? 0})
              </TabsTrigger>
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users" className="mt-4">
              {membersQuery.isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : membersQuery.data && membersQuery.data.length > 0 ? (
                <div className="space-y-2">
                  {membersQuery.data.map((member) => (
                    <Card key={member.id}>
                      <CardContent className="flex items-center gap-3 p-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{member.name}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{member.email}</span>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                          {roleLabels[member.role] || member.role}
                        </Badge>
                        {member.id !== user?.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteUserId(member.id);
                              setDeleteUserName(member.name);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum usuário nesta organização</p>
                </div>
              )}
            </TabsContent>

            {/* PDVs Tab */}
            <TabsContent value="pdvs" className="mt-4">
              {pdvsQuery.isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : pdvsQuery.data && pdvsQuery.data.length > 0 ? (
                <div className="space-y-2">
                  {pdvsQuery.data.map((pdv) => (
                    <Card key={pdv.id}>
                      <CardContent className="flex items-center gap-3 p-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{pdv.name}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{pdv.location}</span>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">
                          {pdv.machine_id}
                        </span>
                        <Badge
                          variant={pdv.status === "active" ? "default" : "secondary"}
                          className="text-xs flex-shrink-0"
                        >
                          {pdv.status === "active" ? "Ativo" : "Inativo"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditPdvOpen(pdv);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletePdvId(pdv.id);
                            setDeletePdvName(pdv.name);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Store className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum PDV nesta organização</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteUserName}</strong>? Esta ação é permanente e não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteUserMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteUserMutation.isPending}
              onClick={() => deleteUserId && deleteUserMutation.mutate(deleteUserId)}
            >
              {deleteUserMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete PDV Confirmation */}
      <AlertDialog open={!!deletePdvId} onOpenChange={() => setDeletePdvId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir PDV</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deletePdvName}</strong>? Todos os dados associados (estoque, vendas, uploads) poderão ser afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePdvMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletePdvMutation.isPending}
              onClick={() => deletePdvId && deletePdvMutation.mutate(deletePdvId)}
            >
              {deletePdvMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit PDV Dialog */}
      <Dialog open={!!editPdv} onOpenChange={() => setEditPdv(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar PDV</DialogTitle>
            <DialogDescription>Atualize as informações do PDV.</DialogDescription>
          </DialogHeader>
          <PDVForm
            values={editForm}
            onChange={setEditForm}
            errors={editErrors}
            onClearError={(field) =>
              setEditErrors((prev) => {
                const next = { ...prev };
                delete next[field];
                return next;
              })
            }
            idPrefix="edit-pdv-"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPdv(null)} disabled={editPdvMutation.isPending}>
              Cancelar
            </Button>
            <Button onClick={handleEditPdvSave} disabled={editPdvMutation.isPending}>
              {editPdvMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
