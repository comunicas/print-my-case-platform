import { useState } from "react";
import { Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useOrganizationsCRUD, OrganizationWithStats, OrganizationInsert } from "@/hooks/useOrganizationsCRUD";
import { organizationSchema, OrganizationFormData } from "@/lib/schemas/organization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Plus, Search, Users, Store, Pencil, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const PLANS = ["Básico", "Profissional", "Enterprise"];

export default function Organizations() {
  const {
    organizations,
    isLoading,
    isSuperAdmin,
    createOrganization,
    updateOrganization,
    deleteOrganization,
  } = useOrganizationsCRUD();

  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<OrganizationWithStats | null>(null);
  const [formData, setFormData] = useState<OrganizationFormData>({
    name: "",
    cnpj: "",
    email: "",
    phone: "",
    address: "",
    plan: "Profissional",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Redirect non-super_admins
  if (!isLoading && !isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  const filteredOrganizations = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.cnpj?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenCreate = () => {
    setSelectedOrg(null);
    setFormData({
      name: "",
      cnpj: "",
      email: "",
      phone: "",
      address: "",
      plan: "Profissional",
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleOpenEdit = (org: OrganizationWithStats) => {
    setSelectedOrg(org);
    setFormData({
      name: org.name,
      cnpj: org.cnpj || "",
      email: org.email || "",
      phone: org.phone || "",
      address: org.address || "",
      plan: org.plan || "Profissional",
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleOpenDelete = (org: OrganizationWithStats) => {
    setSelectedOrg(org);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const result = organizationSchema.safeParse(formData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setFormErrors(errors);
      return;
    }

    const cleanData: OrganizationInsert = {
      name: formData.name,
      cnpj: formData.cnpj || null,
      email: formData.email || null,
      phone: formData.phone || null,
      address: formData.address || null,
      plan: formData.plan || null,
    };

    if (selectedOrg) {
      await updateOrganization.mutateAsync({ id: selectedOrg.id, ...cleanData });
    } else {
      await createOrganization.mutateAsync(cleanData);
    }

    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!selectedOrg) return;
    await deleteOrganization.mutateAsync(selectedOrg.id);
    setDeleteDialogOpen(false);
    setSelectedOrg(null);
  };

  const isSubmitting = createOrganization.isPending || updateOrganization.isPending;
  const isDeleting = deleteOrganization.isPending;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Organizações</h1>
            <p className="text-muted-foreground">
              Gerencie todas as organizações do sistema
            </p>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Organização
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CNPJ ou email..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Organizations Grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredOrganizations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm
                  ? "Nenhuma organização encontrada"
                  : "Nenhuma organização cadastrada"}
              </p>
              {!searchTerm && (
                <Button variant="outline" className="mt-4" onClick={handleOpenCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar primeira organização
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredOrganizations.map((org) => (
              <Card key={org.id} className="group relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{org.name}</CardTitle>
                      {org.cnpj && (
                        <CardDescription className="font-mono text-xs">
                          {org.cnpj}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenEdit(org)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleOpenDelete(org)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{org.usersCount} usuários</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Store className="h-4 w-4" />
                      <span>{org.pdvsCount} PDVs</span>
                    </div>
                  </div>
                  {org.email && (
                    <p className="text-sm text-muted-foreground truncate">{org.email}</p>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      {org.plan || "Profissional"}
                    </span>
                    {org.created_at && (
                      <span className="text-xs text-muted-foreground">
                        Criada em {format(new Date(org.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedOrg ? "Editar Organização" : "Nova Organização"}
            </DialogTitle>
            <DialogDescription>
              {selectedOrg
                ? "Altere as informações da organização"
                : "Preencha os dados para criar uma nova organização"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={formErrors.name ? "border-destructive" : ""}
              />
              {formErrors.name && (
                <p className="text-sm text-destructive">{formErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={formData.cnpj || ""}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={formErrors.email ? "border-destructive" : ""}
                />
                {formErrors.email && (
                  <p className="text-sm text-destructive">{formErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={formData.address || ""}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan">Plano</Label>
              <Select
                value={formData.plan || "Profissional"}
                onValueChange={(value) => setFormData({ ...formData, plan: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLANS.map((plan) => (
                    <SelectItem key={plan} value={plan}>
                      {plan}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : selectedOrg ? (
                  "Salvar"
                ) : (
                  "Criar"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir organização?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Tem certeza que deseja excluir <strong>{selectedOrg?.name}</strong>?
              </p>
              {selectedOrg && (selectedOrg.usersCount > 0 || selectedOrg.pdvsCount > 0) && (
                <p className="text-destructive font-medium">
                  ⚠️ Esta organização possui {selectedOrg.usersCount} usuário(s) e{" "}
                  {selectedOrg.pdvsCount} PDV(s) associados. Eles ficarão órfãos após a exclusão.
                </p>
              )}
              <p>Esta ação não pode ser desfeita.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
