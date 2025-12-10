import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
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
  DialogTrigger,
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
import { Plus, Users, Search, Pencil, Trash2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TeamMemberForm } from "@/components/team/TeamMemberForm";
import {
  teamMemberFormSchema,
  TeamMemberFormData,
  TeamMemberRole,
  TeamMemberStatus,
  roleLabels,
  statusLabels,
  rolePermissions,
} from "@/lib/schemas/team";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamMemberRole;
  status: TeamMemberStatus;
  createdAt: string;
}

const mockTeamMembers: TeamMember[] = [
  {
    id: "1",
    name: "Carlos Silva",
    email: "carlos@printmycase.com",
    role: "super_admin",
    status: "active",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "Maria Santos",
    email: "maria@printmycase.com",
    role: "org_admin",
    status: "active",
    createdAt: "2024-02-20",
  },
  {
    id: "3",
    name: "João Oliveira",
    email: "joao@printmycase.com",
    role: "operator",
    status: "active",
    createdAt: "2024-03-10",
  },
  {
    id: "4",
    name: "Ana Costa",
    email: "ana@printmycase.com",
    role: "operator",
    status: "pending",
    createdAt: "2024-05-01",
  },
  {
    id: "5",
    name: "Pedro Ferreira",
    email: "pedro@printmycase.com",
    role: "viewer",
    status: "active",
    createdAt: "2024-04-15",
  },
  {
    id: "6",
    name: "Lucia Mendes",
    email: "lucia@printmycase.com",
    role: "viewer",
    status: "inactive",
    createdAt: "2024-03-25",
  },
];

const getRoleBadgeClass = (role: TeamMemberRole): string => {
  switch (role) {
    case "super_admin":
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

const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString("pt-BR");
};

export default function Team() {
  const [members, setMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null);
  const [newMember, setNewMember] = useState<TeamMemberFormData>({
    name: "",
    email: "",
    role: "operator",
    status: "pending",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const validateForm = (data: TeamMemberFormData, excludeId?: string): boolean => {
    const result = teamMemberFormSchema.safeParse(data);

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setFormErrors(errors);
      return false;
    }

    const isDuplicate = members.some(
      (m) =>
        m.email.toLowerCase() === data.email.toLowerCase() &&
        m.id !== excludeId
    );

    if (isDuplicate) {
      setFormErrors({ email: "Este email já está em uso" });
      return false;
    }

    setFormErrors({});
    return true;
  };

  const clearFormErrors = () => setFormErrors({});

  const handleClearError = (field: string) => {
    setFormErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      roleLabels[member.role].toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateMember = () => {
    if (!validateForm(newMember)) {
      return;
    }

    const member: TeamMember = {
      id: String(Date.now()),
      name: newMember.name.trim(),
      email: newMember.email.trim(),
      role: newMember.role,
      status: newMember.status,
      createdAt: new Date().toISOString().split("T")[0],
    };

    setMembers([...members, member]);
    setNewMember({ name: "", email: "", role: "operator", status: "pending" });
    clearFormErrors();
    setIsCreateDialogOpen(false);

    toast({
      title: "Membro adicionado",
      description: `${member.name} foi adicionado à equipe.`,
    });
  };

  const handleOpenEdit = (member: TeamMember) => {
    setEditingMember({ ...member });
    clearFormErrors();
    setIsEditDialogOpen(true);
  };

  const handleEditMember = () => {
    if (!editingMember) return;

    if (!validateForm(editingMember, editingMember.id)) {
      return;
    }

    const updatedMember = {
      ...editingMember,
      name: editingMember.name.trim(),
      email: editingMember.email.trim(),
    };

    setMembers(members.map((m) => (m.id === updatedMember.id ? updatedMember : m)));
    clearFormErrors();
    setIsEditDialogOpen(false);
    setEditingMember(null);

    toast({
      title: "Membro atualizado",
      description: `${updatedMember.name} foi atualizado com sucesso.`,
    });
  };

  const handleOpenDelete = (member: TeamMember) => {
    setDeletingMember(member);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteMember = () => {
    if (!deletingMember) return;

    setMembers(members.filter((m) => m.id !== deletingMember.id));
    setIsDeleteDialogOpen(false);

    toast({
      title: "Membro removido",
      description: `${deletingMember.name} foi removido da equipe.`,
    });

    setDeletingMember(null);
  };

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">
              Equipe
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Gerencie usuários e permissões
            </p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Membro
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Novo Membro</DialogTitle>
                <DialogDescription>
                  Adicione um novo membro à equipe.
                </DialogDescription>
              </DialogHeader>
              <TeamMemberForm
                values={newMember}
                onChange={setNewMember}
                errors={formErrors}
                onClearError={handleClearError}
                idPrefix="create-"
              />
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    clearFormErrors();
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreateMember}>Adicionar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou função..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
          {filteredMembers.map((member) => (
            <Card key={member.id} className="hover:shadow-md transition-shadow min-w-0">
              <CardHeader className="pb-2 px-4 md:px-6 pt-4 md:pt-6">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback className={getAvatarColor(member.role)}>
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <CardTitle className="text-base md:text-lg font-semibold truncate">
                        {member.name}
                      </CardTitle>
                      <TooltipProvider>
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
                      </TooltipProvider>
                    </div>
                    <div className="flex items-center gap-1 text-xs md:text-sm text-muted-foreground mt-0.5">
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <span className={`font-medium ${getStatusColor(member.status)}`}>
                      ● {statusLabels[member.status]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <span className="text-muted-foreground">Desde</span>
                    <span className="font-medium">{formatDate(member.createdAt)}</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleOpenEdit(member)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleOpenDelete(member)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
                : "Adicione o primeiro membro da equipe."}
            </p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
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
            <Button onClick={handleEditMember}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover "{deletingMember?.name}" da equipe? Esta
              ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
