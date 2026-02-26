import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Users, Store, Mail, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getInitials } from "@/lib/utils";

interface OrgDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  organizationName: string;
}

interface OrgMember {
  id: string;
  name: string;
  email: string;
  status: string | null;
  role: string;
}

interface OrgPDV {
  id: string;
  name: string;
  location: string;
  machine_id: string;
  status: string | null;
}

export function OrgDetailDialog({
  open,
  onOpenChange,
  organizationId,
  organizationName,
}: OrgDetailDialogProps) {
  const [activeTab, setActiveTab] = useState("users");

  const membersQuery = useQuery({
    queryKey: ["org-detail-members", organizationId],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, name, email, status")
        .eq("organization_id", organizationId)
        .order("name");

      if (profilesError) throw profilesError;

      const profileIds = profiles.map((p) => p.id);
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", profileIds);

      if (rolesError) throw rolesError;

      const roleMap = new Map(roles.map((r) => [r.user_id, r.role]));

      return profiles.map((p) => ({
        ...p,
        role: roleMap.get(p.id) || "viewer",
      })) as OrgMember[];
    },
    enabled: open && !!organizationId,
  });

  const pdvsQuery = useQuery({
    queryKey: ["org-detail-pdvs", organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pdvs")
        .select("id, name, location, machine_id, status")
        .eq("organization_id", organizationId)
        .order("name");

      if (error) throw error;
      return data as OrgPDV[];
    },
    enabled: open && !!organizationId,
  });

  const roleLabels: Record<string, string> = {
    super_admin: "Super Admin",
    org_admin: "Admin",
    operator: "Operador",
    viewer: "Visualizador",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {organizationName}
          </DialogTitle>
          <DialogDescription>
            Detalhes da organização
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="users" className="flex-1 gap-1.5">
              <Users className="h-4 w-4" />
              Usuários ({membersQuery.data?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="pdvs" className="flex-1 gap-1.5">
              <Store className="h-4 w-4" />
              PDVs ({pdvsQuery.data?.length ?? 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4">
            {membersQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : membersQuery.data && membersQuery.data.length > 0 ? (
              <div className="space-y-2">
                {membersQuery.data.map((member) => (
                  <Card key={member.id}>
                    <CardContent className="flex items-center gap-3 p-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{member.name}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{member.email}</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        {roleLabels[member.role] || member.role}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum usuário nesta organização</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="pdvs" className="mt-4">
            {pdvsQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : pdvsQuery.data && pdvsQuery.data.length > 0 ? (
              <div className="space-y-2">
                {pdvsQuery.data.map((pdv) => (
                  <Card key={pdv.id}>
                    <CardContent className="flex items-center gap-3 p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{pdv.name}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{pdv.location}</span>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">
                        {pdv.machine_id}
                      </span>
                      <Badge
                        variant={pdv.status === "active" ? "default" : "secondary"}
                        className="text-xs flex-shrink-0"
                      >
                        {pdv.status === "active" ? "Ativo" : "Inativo"}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Store className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum PDV nesta organização</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
