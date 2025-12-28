import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, AlertCircle } from "lucide-react";
import { createUserSchema, CreateUserFormData } from "@/lib/schemas/user";
import { useOrganizations } from "@/hooks/useOrganizations";

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateUserFormData) => Promise<void>;
  isLoading: boolean;
}

const roleLabels: Record<string, string> = {
  org_admin: "Administrador",
  operator: "Operador",
  viewer: "Visualizador",
};

const roleDescriptions: Record<string, string> = {
  org_admin: "Acesso total à organização",
  operator: "Pode fazer uploads e ver dados",
  viewer: "Apenas visualização de dados",
};

export function CreateUserDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isLoading 
}: CreateUserDialogProps) {
  const { organizations, isLoading: orgsLoading } = useOrganizations();
  
  const [formData, setFormData] = useState<CreateUserFormData>({
    name: "",
    email: "",
    password: "",
    createNewOrganization: true,
    organizationId: undefined,
    organizationName: "",
    role: "org_admin",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof CreateUserFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = createUserSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    await onSubmit(result.data);
    
    // Reset form on success
    setFormData({ 
      name: "", 
      email: "", 
      password: "", 
      createNewOrganization: true,
      organizationId: undefined,
      organizationName: "",
      role: "org_admin",
    });
    setErrors({});
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset form when closing
      setFormData({ 
        name: "", 
        email: "", 
        password: "", 
        createNewOrganization: true,
        organizationId: undefined,
        organizationName: "",
        role: "org_admin",
      });
      setErrors({});
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Usuário</DialogTitle>
          <DialogDescription>
            Crie um novo usuário e defina sua organização e permissões.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Nome */}
            <div className="grid gap-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Nome completo"
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="email@exemplo.com"
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            {/* Senha */}
            <div className="grid gap-2">
              <Label htmlFor="password">Senha Temporária *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className={errors.password ? "border-destructive" : ""}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            {/* Toggle: Nova organização ou existente */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="createNewOrganization" className="text-base">
                  Criar nova organização
                </Label>
                <p className="text-sm text-muted-foreground">
                  {formData.createNewOrganization 
                    ? "Uma nova organização será criada para este usuário" 
                    : "O usuário será vinculado a uma organização existente"}
                </p>
              </div>
              <Switch
                id="createNewOrganization"
                checked={formData.createNewOrganization}
                onCheckedChange={(checked) => handleChange("createNewOrganization", checked)}
              />
            </div>

            {/* Nome da Organização (se criar nova) */}
            {formData.createNewOrganization && (
              <div className="grid gap-2">
                <Label htmlFor="organizationName">Nome da Organização</Label>
                <Input
                  id="organizationName"
                  value={formData.organizationName}
                  onChange={(e) => handleChange("organizationName", e.target.value)}
                  placeholder="Deixe vazio para usar o nome do usuário"
                />
                <p className="text-xs text-muted-foreground">
                  Se não informado, será usado o nome do usuário
                </p>
              </div>
            )}

            {/* Select de Organização (se vincular a existente) */}
            {!formData.createNewOrganization && (
              <div className="grid gap-2">
                <Label htmlFor="organizationId">Organização *</Label>
                <Select
                  value={formData.organizationId}
                  onValueChange={(value) => handleChange("organizationId", value)}
                  disabled={orgsLoading}
                >
                  <SelectTrigger className={errors.organizationId ? "border-destructive" : ""}>
                    <SelectValue placeholder={orgsLoading ? "Carregando..." : "Selecione uma organização"} />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.organizationId && (
                  <p className="text-sm text-destructive">{errors.organizationId}</p>
                )}
              </div>
            )}

            {/* Role */}
            <div className="grid gap-2">
              <Label htmlFor="role">Perfil de Acesso *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleChange("role", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o perfil" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roleLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex flex-col">
                        <span>{label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {roleDescriptions[formData.role]}
              </p>
            </div>

            {/* Aviso para operator/viewer */}
            {(formData.role === "operator" || formData.role === "viewer") && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <p className="font-medium">Acesso limitado</p>
                  <p className="text-xs mt-1">
                    {formData.role === "operator" 
                      ? "Operadores podem fazer uploads e visualizar dados, mas não podem gerenciar a equipe ou configurações."
                      : "Visualizadores só podem ver dados, sem permissão para fazer uploads ou alterações."}
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Usuário"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
