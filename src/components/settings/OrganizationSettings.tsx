import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { organizationFormSchema } from "@/lib/schemas/settings";
import { parseZodErrors } from "@/lib/utils";
import { Organization } from "@/hooks/useOrganization";
import { UseMutationResult } from "@tanstack/react-query";
import { PDVCatalogList } from "./PDVCatalogList";
interface OrganizationSettingsProps {
  organization: Organization;
  isAdmin: boolean;
  updateOrganization: UseMutationResult<unknown, Error, Partial<Organization>>;
}

export function OrganizationSettings({ organization, isAdmin, updateOrganization }: OrganizationSettingsProps) {
  const [orgData, setOrgData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [orgErrors, setOrgErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    if (organization) {
      setOrgData({
        name: organization.name || "",
        email: organization.email || "",
        phone: organization.phone || "",
        address: organization.address || "",
      });
    }
  }, [organization]);

  const handleSaveOrganization = () => {
    if (!isAdmin) {
      toast.error("Permissão negada", {
        description: "Apenas administradores podem editar a organização.",
      });
      return;
    }
    
    const result = organizationFormSchema.safeParse(orgData);
    const errors = parseZodErrors(result);
    if (errors) {
      setOrgErrors(errors);
      return;
    }
    setOrgErrors({});
    
    updateOrganization.mutate({
      name: orgData.name.trim(),
      email: orgData.email.trim(),
      phone: orgData.phone || null,
      address: orgData.address || null,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Dados da Organização</CardTitle>
            <CardDescription>
              Informações da sua empresa
            </CardDescription>
          </div>
          <Badge variant="outline" className="w-fit">
            Plano: {organization?.plan || "Básico"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="orgName">Nome da empresa</Label>
            <Input
              id="orgName"
              value={orgData.name}
              onChange={(e) => {
                setOrgData({ ...orgData, name: e.target.value });
                if (orgErrors.name) setOrgErrors({ ...orgErrors, name: "" });
              }}
              disabled={!isAdmin}
              className={orgErrors.name ? "border-destructive" : ""}
            />
            {orgErrors.name && (
              <p className="text-sm text-destructive">{orgErrors.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="orgEmail">Email corporativo</Label>
            <Input
              id="orgEmail"
              type="email"
              value={orgData.email}
              onChange={(e) => {
                setOrgData({ ...orgData, email: e.target.value });
                if (orgErrors.email) setOrgErrors({ ...orgErrors, email: "" });
              }}
              disabled={!isAdmin}
              className={orgErrors.email ? "border-destructive" : ""}
            />
            {orgErrors.email && (
              <p className="text-sm text-destructive">{orgErrors.email}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="orgPhone">Telefone</Label>
            <PhoneInput
              id="orgPhone"
              value={orgData.phone}
              onChange={(value) => {
                setOrgData({ ...orgData, phone: value });
                if (orgErrors.phone) setOrgErrors({ ...orgErrors, phone: "" });
              }}
              disabled={!isAdmin}
              placeholder="(00) 00000-0000"
              className={orgErrors.phone ? "border-destructive" : ""}
            />
            {orgErrors.phone && (
              <p className="text-sm text-destructive">{orgErrors.phone}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              value={organization?.cnpj || ""}
              disabled
              placeholder="Não informado"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Endereço</Label>
          <Input
            id="address"
            value={orgData.address}
            onChange={(e) => {
              setOrgData({ ...orgData, address: e.target.value });
              if (orgErrors.address) setOrgErrors({ ...orgErrors, address: "" });
            }}
            disabled={!isAdmin}
            placeholder="Rua, número, bairro, cidade - UF"
            className={orgErrors.address ? "border-destructive" : ""}
          />
          {orgErrors.address && (
            <p className="text-sm text-destructive">{orgErrors.address}</p>
          )}
        </div>

        {isAdmin && (
          <div className="flex justify-end">
            <Button 
              onClick={handleSaveOrganization}
              disabled={updateOrganization.isPending}
            >
              {updateOrganization.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Salvar Alterações
            </Button>
          </div>
        )}

        {isAdmin && (
          <>
            <Separator />
            
            {/* Catálogo Público por PDV */}
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold">Catálogos Públicos</h3>
                <p className="text-sm text-muted-foreground">
                  Configure URLs públicas independentes para cada PDV. Clientes poderão ver a disponibilidade dos produtos sem login.
                </p>
              </div>

              <PDVCatalogList organizationId={organization.id} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
