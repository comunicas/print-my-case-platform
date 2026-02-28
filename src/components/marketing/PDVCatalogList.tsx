import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, Loader2, Link2, MousePointerClick } from "lucide-react";
import { toast } from "sonner";
import { usePDVCatalogSettings, type ShortLink } from "@/hooks/usePDVCatalogSettings";
import { CUSTOM_DOMAIN } from "@/lib/constants";

interface PDVCatalogListProps {
  organizationId?: string;
}

interface PDVCatalogRowProps {
  pdv: {
    id: string;
    name: string;
    location: string;
    organization_name: string | null;
    catalog_settings: {
      public_slug: string | null;
      is_public_enabled: boolean;
    } | null;
    short_link: ShortLink | null;
  };
  onSave: (pdvId: string, slug: string, enabled: boolean) => void;
  isSaving: boolean;
  showOrgName: boolean;
}

function PDVCatalogRow({ pdv, onSave, isSaving, showOrgName }: PDVCatalogRowProps) {
  const [enabled, setEnabled] = useState(pdv.catalog_settings?.is_public_enabled || false);
  const [slug, setSlug] = useState(pdv.catalog_settings?.public_slug || "");
  
  const hasChanges = 
    enabled !== (pdv.catalog_settings?.is_public_enabled || false) ||
    slug !== (pdv.catalog_settings?.public_slug || "");

  const catalogUrl = slug ? `${CUSTOM_DOMAIN}/catalogo/${slug}` : "";
  const shortLinkUrl = pdv.short_link ? `${CUSTOM_DOMAIN}/s/${pdv.short_link.short_code}` : "";

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  };

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{pdv.name}</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm text-muted-foreground">{pdv.location}</p>
            {showOrgName && pdv.organization_name && (
              <Badge variant="secondary" className="text-xs font-normal">{pdv.organization_name}</Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {enabled && slug && (
            <Badge variant="default" className="text-xs">Ativo</Badge>
          )}
          <Switch
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>
      </div>

      {enabled && (
        <div className="space-y-3 pt-1">
          <div className="space-y-2">
            <Label>Slug do catálogo</Label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                /catalogo/
              </span>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="meu-pdv"
                className="rounded-l-none"
              />
            </div>
          </div>

          {catalogUrl && slug && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Link completo</Label>
              <div className="flex gap-2">
                <Input value={catalogUrl} readOnly className="font-mono text-sm" />
                <Button type="button" variant="outline" size="icon" onClick={() => handleCopy(catalogUrl)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" size="icon" asChild>
                  <a href={catalogUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          )}

          {pdv.short_link && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                <Label className="text-xs text-muted-foreground">Link curto</Label>
                <div className="flex items-center gap-1 ml-auto">
                  <MousePointerClick className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {pdv.short_link.click_count} {pdv.short_link.click_count === 1 ? "clique" : "cliques"}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Input value={shortLinkUrl} readOnly className="font-mono text-sm" />
                <Button type="button" variant="outline" size="icon" onClick={() => handleCopy(shortLinkUrl)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {hasChanges && (
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={() => onSave(pdv.id, slug, enabled)}
                disabled={isSaving || !slug}
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Salvar
              </Button>
            </div>
          )}
        </div>
      )}

      {!enabled && hasChanges && (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onSave(pdv.id, slug, enabled)}
            disabled={isSaving}
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Desativar
          </Button>
        </div>
      )}
    </div>
  );
}

export function PDVCatalogList({ organizationId }: PDVCatalogListProps) {
  const { pdvsWithSettings, isLoading, upsertSettings } = usePDVCatalogSettings(organizationId);
  const showOrgName = !organizationId;

  const handleSave = (pdvId: string, slug: string, enabled: boolean) => {
    upsertSettings.mutate({
      pdv_id: pdvId,
      public_slug: enabled ? slug.toLowerCase().trim() : null,
      is_public_enabled: enabled,
    });
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando PDVs...</p>;
  }

  if (pdvsWithSettings.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum PDV ativo encontrado.</p>;
  }

  return (
    <div className="space-y-3">
      {pdvsWithSettings.map((pdv) => (
        <PDVCatalogRow
          key={pdv.id}
          pdv={pdv}
          onSave={handleSave}
          isSaving={upsertSettings.isPending}
          showOrgName={showOrgName}
        />
      ))}
    </div>
  );
}
