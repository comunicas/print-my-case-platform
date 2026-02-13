import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { usePDVCatalogSettings } from "@/hooks/usePDVCatalogSettings";

interface PDVCatalogListProps {
  organizationId: string;
}

const CUSTOM_DOMAIN = "https://printmycase.comunicas.com.br";

interface PDVCatalogRowProps {
  pdv: {
    id: string;
    name: string;
    location: string;
    catalog_settings: {
      public_slug: string | null;
      is_public_enabled: boolean;
    } | null;
  };
  onSave: (pdvId: string, slug: string, enabled: boolean) => void;
  isSaving: boolean;
}

function PDVCatalogRow({ pdv, onSave, isSaving }: PDVCatalogRowProps) {
  const [enabled, setEnabled] = useState(pdv.catalog_settings?.is_public_enabled || false);
  const [slug, setSlug] = useState(pdv.catalog_settings?.public_slug || "");
  
  const hasChanges = 
    enabled !== (pdv.catalog_settings?.is_public_enabled || false) ||
    slug !== (pdv.catalog_settings?.public_slug || "");

  const catalogUrl = slug ? `${CUSTOM_DOMAIN}/catalogo/${slug}` : "";

  const handleCopyLink = () => {
    if (catalogUrl) {
      navigator.clipboard.writeText(catalogUrl);
      toast.success("Link copiado!");
    }
  };

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{pdv.name}</p>
          <p className="text-sm text-muted-foreground">{pdv.location}</p>
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
            <div className="flex gap-2">
              <Input value={catalogUrl} readOnly className="font-mono text-sm" />
              <Button type="button" variant="outline" size="icon" onClick={handleCopyLink}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" size="icon" asChild>
                <a href={catalogUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
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
        />
      ))}
    </div>
  );
}
