import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Copy, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { organizationFormSchema } from "@/lib/schemas/settings";
import { parseZodErrors } from "@/lib/utils";
import { Organization } from "@/hooks/useOrganization";
import { UseMutationResult } from "@tanstack/react-query";
import { usePDVs } from "@/hooks/usePDVs";

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
  
  const [catalogEnabled, setCatalogEnabled] = useState(false);
  const [publicSlug, setPublicSlug] = useState("");
  const [catalogPdvId, setCatalogPdvId] = useState<string | null>(null);
  
  const { pdvs } = usePDVs({ organizationId: organization?.id });

  useEffect(() => {
    if (organization) {
      setOrgData({
        name: organization.name || "",
        email: organization.email || "",
        phone: organization.phone || "",
        address: organization.address || "",
      });
      setCatalogEnabled(organization.public_catalog_enabled || false);
      setPublicSlug(organization.public_slug || "");
      setCatalogPdvId(organization.catalog_pdv_id || null);
    }
  }, [organization]);

  const handleSaveOrganization = () => {
    if (!isAdmin) {
      toast({
        title: "Permissão negada",
        description: "Apenas administradores podem editar a organização.",
        variant: "destructive",
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

  const handleSaveCatalog = () => {
    if (!isAdmin) return;
    
    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (catalogEnabled && publicSlug && !slugRegex.test(publicSlug)) {
      toast({
        title: "Slug inválido",
        description: "Use apenas letras minúsculas, números e hífens.",
        variant: "destructive",
      });
      return;
    }
    
    updateOrganization.mutate({
      public_catalog_enabled: catalogEnabled,
      public_slug: catalogEnabled ? publicSlug.toLowerCase().trim() : null,
      catalog_pdv_id: catalogPdvId,
    });
  };

  const CUSTOM_DOMAIN = "https://printmycase.comunicas.com.br";
  
  const catalogUrl = publicSlug 
    ? `${CUSTOM_DOMAIN}/catalogo/${publicSlug}`
    : "";

  const handleCopyLink = () => {
    if (catalogUrl) {
      navigator.clipboard.writeText(catalogUrl);
      toast({
        title: "Link copiado!",
        description: "O link do catálogo foi copiado para a área de transferência.",
      });
    }
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
            
            {/* Catálogo Público */}
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold">Catálogo Público</h3>
                <p className="text-sm text-muted-foreground">
                  Permita que clientes vejam a disponibilidade dos seus produtos sem precisar de login.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="catalog-enabled">Ativar catálogo público</Label>
                  <p className="text-sm text-muted-foreground">
                    Quando ativo, uma página pública mostrará seu estoque.
                  </p>
                </div>
                <Switch
                  id="catalog-enabled"
                  checked={catalogEnabled}
                  onCheckedChange={setCatalogEnabled}
                />
              </div>

              {catalogEnabled && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="public-slug">Slug do catálogo</Label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                            /catalogo/
                          </span>
                          <Input
                            id="public-slug"
                            value={publicSlug}
                            onChange={(e) => setPublicSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                            placeholder="minha-loja"
                            className="rounded-l-none"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Apenas letras minúsculas, números e hífens.
                        </p>
                      </div>
                    </div>
                  </div>

                  {catalogUrl && publicSlug && (
                    <div className="space-y-2">
                      <Label>Link do catálogo</Label>
                      <div className="flex gap-2">
                        <Input
                          value={catalogUrl}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handleCopyLink}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          asChild
                        >
                          <a href={catalogUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* PDV do Catálogo */}
                  <div className="space-y-2">
                    <Label htmlFor="catalog-pdv">PDV do catálogo</Label>
                    <Select
                      value={catalogPdvId || "all"}
                      onValueChange={(value) => setCatalogPdvId(value === "all" ? null : value)}
                    >
                      <SelectTrigger id="catalog-pdv">
                        <SelectValue placeholder="Selecione um PDV" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os PDVs</SelectItem>
                        {pdvs?.map((pdv) => (
                          <SelectItem key={pdv.id} value={pdv.id}>
                            {pdv.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Escolha um PDV específico ou exiba o estoque de todos agregados.
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveCatalog}
                      disabled={updateOrganization.isPending || !publicSlug}
                    >
                      {updateOrganization.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Salvar Catálogo
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
