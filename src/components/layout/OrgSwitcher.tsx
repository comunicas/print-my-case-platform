import { Building2, Eye, Link } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useActiveOrg } from "@/contexts/ActiveOrgContext";

export function OrgSwitcher() {
  const { activeOrgId, setActiveOrgId, organizations, hasMultipleOrgs, isOwnOrg, isReadOnly } = useActiveOrg();

  if (!hasMultipleOrgs) return null;

  const activeOrg = organizations.find(o => o.id === activeOrgId);

  const getAccessIcon = (accessLevel: string) => {
    switch (accessLevel) {
      case "viewer":
        return <Eye className="h-3 w-3 text-muted-foreground flex-shrink-0" />;
      case "editor":
        return <Link className="h-3 w-3 text-muted-foreground flex-shrink-0" />;
      default:
        return <Building2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />;
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={activeOrgId ?? ""} onValueChange={setActiveOrgId}>
        <SelectTrigger className="w-full sm:w-[200px] h-9">
          <Building2 className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
          <SelectValue placeholder="Selecione a empresa" />
        </SelectTrigger>
        <SelectContent>
          {organizations.map((org) => (
            <SelectItem key={org.id} value={org.id}>
              <span className="flex items-center gap-2">
                {getAccessIcon(org.accessLevel)}
                {org.name}
                {org.accessLevel === "viewer" && (
                  <span className="text-[10px] text-muted-foreground">Leitura</span>
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {!isOwnOrg && activeOrg && (
        <>
          {isReadOnly ? (
            <Badge variant="secondary" className="text-xs whitespace-nowrap">
              Somente leitura
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs whitespace-nowrap">
              Compartilhada
            </Badge>
          )}
        </>
      )}
    </div>
  );
}
