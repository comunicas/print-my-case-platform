import { Building2, Eye } from "lucide-react";
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
  const { activeOrgId, setActiveOrgId, organizations, hasMultipleOrgs, isReadOnly } = useActiveOrg();

  if (!hasMultipleOrgs) return null;

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
                {org.name}
                {org.accessLevel === "viewer" && (
                  <Eye className="h-3 w-3 text-muted-foreground" />
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isReadOnly && (
        <Badge variant="secondary" className="text-xs whitespace-nowrap">
          Somente leitura
        </Badge>
      )}
    </div>
  );
}
