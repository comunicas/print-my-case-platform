import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, MapPin, Search, Pencil, Trash2, Loader2, Building2 } from "lucide-react";
import { PDVForm } from "@/components/pdv/PDVForm";
import { pdvFormSchema, PDVFormData } from "@/lib/schemas/pdv";
import { parseZodErrors } from "@/lib/utils";
import { usePDVs, PDV } from "@/hooks/usePDVs";
import { useProfile } from "@/hooks/useProfile";
import { useOrganizations } from "@/hooks/useOrganizations";

interface EditingPDV {
  id: string;
  name: string;
  location: string;
  machineId: string;
  status: "active" | "inactive";
}

export function PDVsSettings() {
  const { isAdmin, role } = useProfile();
  const isSuperAdmin = role === "super_admin";
  const { organizations } = useOrganizations();
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>("all");
  
  const { pdvs, isLoading, createPDV, updatePDV, deletePDV } = usePDVs({
    organizationId: isSuperAdmin ? (selectedOrgFilter !== "all" ? selectedOrgFilter : undefined) : undefined,
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingPdv, setEditingPdv] = useState<EditingPDV | null>(null);
  const [deletingPdv, setDeletingPdv] = useState<PDV | null>(null);
  const [createOrgId, setCreateOrgId] = useState<string>("");
  const [newPdv, setNewPdv] = useState<PDVFormData>({
    name: "",
    location: "",
    machineId: "",
    status: "active",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = (data: PDVFormData, excludeId?: string): boolean => {
    const result = pdvFormSchema.safeParse(data);
    const errors = parseZodErrors(result);

    if (errors) {
      setFormErrors(errors);
      return false;
    }

    const isDuplicate = pdvs.some(
      (p) =>
        p.machine_id.toLowerCase() === data.machineId.toLowerCase() &&
        p.id !== excludeId
    );

    if (isDuplicate) {
      setFormErrors({ machineId: "Este ID de máquina já está em uso" });
      return false;
    }

    setFormErrors({});
    return true;
  };

  const clearFormErrors = () => setFormErrors({});

  const handleClearError = (field: string) => {
    setFormErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const filteredPdvs = pdvs.filter(
    (pdv) =>
      pdv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pdv.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pdv.machine_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreatePdv = () => {
    if (!validateForm(newPdv)) return;

    // Determine target org: use createOrgId if super_admin selected one, or selectedOrgFilter
    const targetOrgId = isSuperAdmin
      ? (createOrgId || (selectedOrgFilter !== "all" ? selectedOrgFilter : ""))
      : "";

    if (isSuperAdmin && !targetOrgId) {
      setFormErrors({ ...formErrors, organization: "Selecione uma organização" });
      return;
    }

    createPDV.mutate(
      {
        name: newPdv.name.trim(),
        location: newPdv.location.trim(),
        machine_id: newPdv.machineId.trim(),
        status: newPdv.status,
        ...(targetOrgId ? { organization_id: targetOrgId } : {}),
      },
      {
        onSuccess: () => {
          setNewPdv({ name: "", location: "", machineId: "", status: "active" });
          setCreateOrgId("");
          clearFormErrors();
          setIsCreateDialogOpen(false);
        },
      }
    );
  };

  const handleOpenEdit = (pdv: PDV) => {
    setEditingPdv({
      id: pdv.id,
      name: pdv.name,
      location: pdv.location,
      machineId: pdv.machine_id,
      status: pdv.status,
    });
    clearFormErrors();
    setIsEditDialogOpen(true);
  };

  const handleEditPdv = () => {
    if (!editingPdv) return;
    if (!validateForm(editingPdv, editingPdv.id)) return;

    updatePDV.mutate(
      {
        id: editingPdv.id,
        name: editingPdv.name.trim(),
        location: editingPdv.location.trim(),
        machine_id: editingPdv.machineId.trim(),
        status: editingPdv.status,
      },
      {
        onSuccess: () => {
          clearFormErrors();
          setIsEditDialogOpen(false);
          setEditingPdv(null);
        },
      }
    );
  };

  const handleOpenDelete = (pdv: PDV) => {
    setDeletingPdv(pdv);
    setIsDeleteDialogOpen(true);
  };

  const handleDeletePdv = () => {
    if (!deletingPdv) return;

    deletePDV.mutate(deletingPdv.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        setDeletingPdv(null);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Pontos de Venda
          </h2>
          <p className="text-sm text-muted-foreground">
            Gerencie suas máquinas e localizações
          </p>
        </div>

        {isAdmin && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar PDV
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[425px] max-h-[90vh] overflow-y-auto overflow-x-hidden">
              <DialogHeader>
                <DialogTitle>Novo Ponto de Venda</DialogTitle>
                <DialogDescription>
                  Adicione um novo PDV para sua organização.
                </DialogDescription>
              </DialogHeader>
              {isSuperAdmin && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Organização *</label>
                  <Select
                    value={createOrgId || (selectedOrgFilter !== "all" ? selectedOrgFilter : "")}
                    onValueChange={setCreateOrgId}
                  >
                    <SelectTrigger className={formErrors.organization ? "border-destructive" : ""}>
                      <SelectValue placeholder="Selecione a organização" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.organization && (
                    <p className="text-sm text-destructive">{formErrors.organization}</p>
                  )}
                </div>
              )}
              <PDVForm
                values={newPdv}
                onChange={setNewPdv}
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
                <Button onClick={handleCreatePdv} disabled={createPDV.isPending}>
                  {createPDV.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  Criar PDV
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
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
            placeholder="Buscar por nome, localização ou ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* PDV Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredPdvs.map((pdv) => (
          <Card key={pdv.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 px-4 pt-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base font-semibold truncate">
                    {pdv.name}
                  </CardTitle>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{pdv.location}</span>
                  </div>
                </div>
                <Badge
                  variant={pdv.status === "active" ? "default" : "secondary"}
                  className="ml-2 flex-shrink-0"
                >
                  {pdv.status === "active" ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">ID Máquina</span>
                  <span className="font-medium">{pdv.machine_id}</span>
                </div>
                {isAdmin && (
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleOpenEdit(pdv)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleOpenDelete(pdv)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredPdvs.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground">
            Nenhum PDV encontrado
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {searchQuery
              ? "Tente ajustar sua busca."
              : "Adicione seu primeiro ponto de venda."}
          </p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[425px] max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>Editar Ponto de Venda</DialogTitle>
            <DialogDescription>
              Atualize as informações do PDV.
            </DialogDescription>
          </DialogHeader>
          {editingPdv && (
            <PDVForm
              values={editingPdv}
              onChange={(values) => setEditingPdv({ ...editingPdv, ...values })}
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
            <Button onClick={handleEditPdv} disabled={updatePDV.isPending}>
              {updatePDV.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o PDV "{deletingPdv?.name}"? Esta
              ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePdv}
              disabled={deletePDV.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePDV.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
