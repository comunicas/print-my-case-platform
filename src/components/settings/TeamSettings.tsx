import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Users, Search, Pencil, Trash2, Mail, Loader2, Building2, MapPin } from "lucide-react";
import { UserPDVsDialog } from "@/components/team/UserPDVsDialog";
import { TeamMemberForm } from "@/components/team/TeamMemberForm";
import { CreateUserDialog } from "@/components/team/CreateUserDialog";
import { toast } from "sonner";
import {
  teamMemberFormSchema,
  TeamMemberFormData,
  TeamMemberRole,
  TeamMemberStatus,
  roleLabels,
  statusLabels,
  rolePermissions,
} from "@/lib/schemas/team";
import { CreateUserFormData } from "@/lib/schemas/user";
import { parseZodErrors, getInitials } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTeamMembers, TeamMember } from "@/hooks/useTeamMembers";
import { useProfile } from "@/hooks/useProfile";
import { useOrganization } from "@/hooks/useOrganization";
import { useOrganizations } from "@/hooks/useOrganizations";

interface EditingMember {
  id: string;
  name: string;
  email: string;
  role: TeamMemberRole;
  status: TeamMemberStatus;
}

const getRoleBadgeClass = (role: TeamMemberRole): string => {
  switch (role) {
    case "super_admin":
      return "bg-violet-600 text-white hover:bg-violet-700 border-transparent";
    case "org_admin":
      return "bg-orange-500 text-white hover:bg-orange-600 border-transparent";
    case "operator":
      return "bg-purple-100 text-purple-800 hover:bg-purple-200 border-transparent";
    case "viewer":
      return "bg-muted text-muted-foreground hover:bg-muted/80 border-transparent";
  }
};

const getAvatarColor = (role: TeamMemberRole): string => {
  switch (role) {
    case "super_admin":
      return "bg-violet-100 text-violet-700";
    case "org_admin":
      return "bg-purple-100 text-purple-700";
    case "operator":
      return "bg-emerald-100 text-emerald-700";
    case "viewer":
      return "bg-blue-100 text-blue-700";
  }
};

const getStatusColor = (status: TeamMemberStatus): string => {
  switch (status) {
    case "active":
      return "text-emerald-600";
    case "pending":
      return "text-orange-500";
    case "inactive":
      return "text-muted-foreground";
  }
};

const formatDate = (dateStr: string): string => {
  return format(new Date(dateStr), "dd/MM/yyyy");
};

export function TeamSettings() {
  const { members, isLoading, isAdmin, isSuperAdmin, updateMember, removeMember, deleteMember, createUser } = useTeamMembers();
  const { profile } = useProfile();
  const { organization } = useOrganization({ readOnly: true });
  const { organizations } = useOrganizations();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>("all");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPDVsDialogOpen, setIsPDVsDialogOpen] = useState(false);
  const [selectedMemberForPDVs, setSelectedMemberForPDVs] = useState<TeamMember | null>(null);
  const [editingMember, setEditingMember] = useState<EditingMember | null>(null);
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = (data: TeamMemberFormData, excludeId?: string): boolean => {
    const result = teamMemberFormSchema.safeParse(data);
    const errors = parseZodErrors(result);

    if (errors) {
      setFormErrors(errors);
      return false;
    }

    setFormErrors({});
    return true;
  };

  const clearFormErrors = () => setFormErrors({});

  const handleClearError = (field: string) => {
    setFormErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      roleLabels[member.role].toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.organization_name && member.organization_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (isSuperAdmin && selectedOrgFilter !== "all") {
      const memberOrg = organizations.find(o => o.name === member.organization_name);
      if (!memberOrg || memberOrg.id !== selectedOrgFilter) return false;
    }

    return matchesSearch;
  });

  const handleCreateUser = async (data: CreateUserFormData) => {
    await createUser.mutateAsync(data);
    setIsCreateDialogOpen(false);
  };

  const handleOpenPDVsDialog = (member: TeamMember) => {
    setSelectedMemberForPDVs(member);
    setIsPDVsDialogOpen(true);
  };

  const handleOpenEdit = (member: TeamMember) => {
    setEditingMember({
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      status: member.status,
    });
    clearFormErrors();
    setIsEditDialogOpen(true);
  };

  const handleEditMember = () => {
    if (!editingMember) return;

    if (!validateForm(editingMember, editingMember.id)) {
      return;
    }

    updateMember.mutate({
      userId: editingMember.id,
      name: editingMember.name.trim(),
      role: editingMember.role,
      status: editingMember.status,
    }, {
      onSuccess: () => {
        clearFormErrors();
        setIsEditDialogOpen(false);
        setEditingMember(null);
      }
    });
  };

  const handleOpenDelete = (member: TeamMember) => {
    setDeletingMember(member);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteMember = () => {
    if (!deletingMember) return;

    // Prevent self-removal
    if (deletingMember.id === profile?.id) {
      toast.error("Ação não permitida", {
        description: "Você não pode remover a si mesmo.",
      });
      setIsDeleteDialogOpen(false);
      setDeletingMember(null);
      return;
    }

    // Super admin: hard delete via edge function
    if (isSuperAdmin) {
      deleteMember.mutate(deletingMember.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setDeletingMember(null);
        }
      });
    } else {
      // org_admin: soft remove (desvincula da org)
      removeMember.mutate(deletingMember.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setDeletingMember(null);
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <TooltipProvider>
    <div className="space-y-4">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Equipe
          </h2>
          <p className="text-sm text-muted-foreground">
            Gerencie usuários e permissões
          </p>
        </div>

        {isSuperAdmin ? (
          <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Usuário
          </Button>
        ) : isAdmin ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button disabled size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Membro
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Em breve: sistema de convites por email</p>
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>

      {/* Org Filter + Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {isSuperAdmin && organizations.length > 0 && (
          <Select value={selectedOrgFilter} onValueChange={setSelectedOrgFilter}>
            <SelectTrigger className="sm:w-[220px]">
              <Building2 className="h-4 w-4 mr-2 flex-shrink-0" />
              <SelectValue placeholder="Todas as organizações" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as organizações</SelectItem>
              {organizations.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou função..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="hover:shadow-md transition-shadow min-w-0">
            <CardHeader className="pb-2 px-4 pt-4">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarFallback className={getAvatarColor(member.role)}>
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <CardTitle className="text-base font-semibold truncate">
                      {member.name}
                    </CardTitle>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          className={`flex-shrink-0 text-xs cursor-help ${getRoleBadgeClass(member.role)}`}
                        >
                          {roleLabels[member.role]}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <div className="space-y-1">
                          <p className="font-semibold text-sm">{roleLabels[member.role]}</p>
                          <ul className="text-xs space-y-0.5">
                            {rolePermissions[member.role].map((permission, index) => (
                              <li key={index} className="flex items-center gap-1">
                                <span className="text-green-500">✓</span> {permission}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <Mail className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`font-medium ${getStatusColor(member.status)}`}>
                    ● {statusLabels[member.status]}
                  </span>
                </div>
                {isSuperAdmin && member.organization_name && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Organização</span>
                    <span className="font-medium flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {member.organization_name}
                    </span>
                  </div>
                )}
                {(member.role === "operator" || member.role === "viewer") && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">PDVs</span>
                    <span className={`font-medium flex items-center gap-1 ${
                      member.pdv_count === 0 ? 'text-orange-500' : 'text-emerald-600'
                    }`}>
                      <MapPin className="h-3 w-3" />
                      {member.pdv_count === 0 ? 'Nenhum atribuído' : `${member.pdv_count} atribuído(s)`}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Desde</span>
                  <span className="font-medium">{formatDate(member.created_at)}</span>
                </div>
                {isAdmin && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleOpenEdit(member)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    {(member.role === "operator" || member.role === "viewer") && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenPDVsDialog(member)}
                            className="relative"
                          >
                            <MapPin className="h-4 w-4" />
                            {member.pdv_count > 0 && (
                              <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-medium">
                                {member.pdv_count}
                              </span>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {member.pdv_count === 0 
                            ? "Nenhum PDV atribuído - clique para atribuir"
                            : `${member.pdv_count} PDV(s) atribuído(s) - clique para gerenciar`}
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {member.id !== profile?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleOpenDelete(member)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
                {member.id === profile?.id && (
                  <Badge variant="outline" className="mt-2 text-xs">
                    Você
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredMembers.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground">
            Nenhum membro encontrado
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {searchQuery
              ? "Tente ajustar sua busca."
              : "Nenhum membro na organização."}
          </p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[425px] max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>Editar Membro</DialogTitle>
            <DialogDescription>
              Atualize as informações do membro.
            </DialogDescription>
          </DialogHeader>
          {editingMember && (
            <TeamMemberForm
              values={editingMember}
              onChange={(values) => setEditingMember({ ...editingMember, ...values })}
              errors={formErrors}
              onClearError={handleClearError}
              idPrefix="edit-"
              disabledFields={["email"]}
              showSuperAdminRole={isSuperAdmin}
            />
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                clearFormErrors();
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleEditMember}
              disabled={updateMember.isPending}
            >
              {updateMember.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isSuperAdmin ? "Excluir usuário permanentemente" : "Confirmar remoção"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isSuperAdmin
                ? `Tem certeza que deseja excluir "${deletingMember?.name}" permanentemente? Esta ação não pode ser desfeita. Todos os dados do usuário serão removidos.`
                : `Tem certeza que deseja remover "${deletingMember?.name}" da organização? O usuário perderá acesso ao sistema.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMember}
              disabled={deleteMember.isPending || removeMember.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {(deleteMember.isPending || removeMember.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isSuperAdmin ? "Excluir Permanentemente" : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Create User Dialog (Super Admin only) */}
      <CreateUserDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateUser}
        isLoading={createUser.isPending}
        adminOrganizationId={profile?.organization_id}
        adminOrganizationName={organization?.name}
        isSuperAdmin={isSuperAdmin}
      />

      {/* PDVs Assignment Dialog */}
      {selectedMemberForPDVs && (
        <UserPDVsDialog
          open={isPDVsDialogOpen}
          onOpenChange={setIsPDVsDialogOpen}
          userId={selectedMemberForPDVs.id}
          userName={selectedMemberForPDVs.name}
          organizationId={
            isSuperAdmin
              ? organizations.find(o => o.name === selectedMemberForPDVs.organization_name)?.id
              : undefined
          }
        />
      )}
    </div>
    </TooltipProvider>
  );
}
