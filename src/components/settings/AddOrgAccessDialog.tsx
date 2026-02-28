import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Loader2, Search, Mail, UserPlus } from "lucide-react";
import { getInitials } from "@/lib/utils";
import type { SearchableUser } from "@/hooks/useOrgCrossAccess";

interface AddOrgAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationName: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  accessLevel: string;
  onAccessLevelChange: (value: string) => void;
  results: SearchableUser[];
  isSearching: boolean;
  onGrant: (userId: string) => void;
  isGranting: boolean;
}

export function AddOrgAccessDialog({
  open,
  onOpenChange,
  organizationName,
  searchTerm,
  onSearchChange,
  accessLevel,
  onAccessLevelChange,
  results,
  isSearching,
  onGrant,
  isGranting,
}: AddOrgAccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[450px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Adicionar Acesso
          </DialogTitle>
          <DialogDescription>
            Conceda acesso a um usuário existente à organização{" "}
            <strong>{organizationName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>Nível de acesso</Label>
            <Select value={accessLevel} onValueChange={onAccessLevelChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Visualizador (somente leitura)</SelectItem>
                <SelectItem value="editor">Editor (leitura e escrita)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Buscar usuário por e-mail ou nome</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Digite pelo menos 2 caracteres..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-2 min-h-[100px]">
            {isSearching ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : results.length > 0 ? (
              results.map((user) => (
                <Card key={user.id}>
                  <CardContent className="flex items-center gap-3 p-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{user.email}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onGrant(user.id)}
                      disabled={isGranting}
                    >
                      {isGranting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Adicionar"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : searchTerm.length >= 2 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                Nenhum usuário encontrado
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground">
                Digite para buscar usuários
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
