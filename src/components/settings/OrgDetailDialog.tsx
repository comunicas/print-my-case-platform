import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Loader2, Users, Store, Mail, MapPin, Pencil, Trash2, Building2, Plus, UserPlus, Link2 } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { PDVForm } from "@/components/pdv/PDVForm";
import { CreateUserDialog } from "@/components/team/CreateUserDialog";
import { useOrgDetailActions } from "@/hooks/useOrgDetailActions";
import { useOrgCrossAccess } from "@/hooks/useOrgCrossAccess";
import { AddOrgAccessDialog } from "@/components/settings/AddOrgAccessDialog";
import { roleLabels } from "@/lib/schemas/team";
import { Separator } from "@/components/ui/separator";

interface OrgDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  organizationName: string;
}

export function OrgDetailDialog({
  open,
  onOpenChange,
  organizationId,
  organizationName,
}: OrgDetailDialogProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("users");

  const actions = useOrgDetailActions(organizationId, organizationName, open);
  const crossAccess = useOrgCrossAccess(organizationId, open);

  const totalUsers = (actions.members?.length ?? 0) + (crossAccess.crossUsers?.length ?? 0);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {organizationName}
            </DialogTitle>
            <DialogDescription>Detalhes da organização</DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="users" className="flex-1 gap-1.5">
                <Users className="h-4 w-4" />
                Usuários ({totalUsers})
              </TabsTrigger>
              <TabsTrigger value="pdvs" className="flex-1 gap-1.5">
                <Store className="h-4 w-4" />
                PDVs ({actions.pdvs?.length ?? 0})
              </TabsTrigger>
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users" className="mt-4 space-y-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={actions.createUser.open}
              >
                <Plus className="h-4 w-4 mr-1" />
                Criar Usuário
              </Button>
              {actions.membersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : actions.members && actions.members.length > 0 ? (
                <div className="space-y-2">
                  {actions.members.map((member) => (
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
                        {member.id === user?.id ? (
                          <Badge variant="secondary" className="text-xs flex-shrink-0">
                            {roleLabels[member.role as keyof typeof roleLabels] || member.role}
                          </Badge>
                        ) : (
                          <Select
                            value={member.role}
                            onValueChange={(newRole) =>
                              actions.updateRole({ userId: member.id, newRole })
                            }
                            disabled={actions.isUpdatingRole}
                          >
                            <SelectTrigger className="h-7 w-[130px] text-xs flex-shrink-0">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="org_admin">Admin</SelectItem>
                              <SelectItem value="operator">Operador</SelectItem>
                              <SelectItem value="viewer">Visualizador</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        {member.id !== user?.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              actions.deleteUser.open(member.id, member.name);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
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

              {/* Cross-org shared access section */}
              <Separator className="my-4" />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium flex items-center gap-1.5">
                    <Link2 className="h-4 w-4 text-muted-foreground" />
                    Acesso compartilhado
                    {crossAccess.crossUsers && crossAccess.crossUsers.length > 0 && (
                      <Badge variant="secondary" className="text-xs ml-1">
                        {crossAccess.crossUsers.length}
                      </Badge>
                    )}
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={crossAccess.addAccess.open}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>

                {crossAccess.crossUsersLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : crossAccess.crossUsers && crossAccess.crossUsers.length > 0 ? (
                  crossAccess.crossUsers.map((cu) => (
                    <Card key={cu.id}>
                      <CardContent className="flex items-center gap-3 p-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="text-xs bg-accent text-accent-foreground">
                            {getInitials(cu.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{cu.name}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            <span className="truncate">{cu.org_name}</span>
                          </div>
                        </div>
                        <Select
                          value={cu.access_level}
                          onValueChange={(val) =>
                            crossAccess.updateAccessLevel({ accessId: cu.id, accessLevel: val })
                          }
                          disabled={crossAccess.isUpdatingAccess}
                        >
                          <SelectTrigger className="h-7 w-[120px] text-xs flex-shrink-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Visualizador</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive flex-shrink-0"
                          onClick={() => crossAccess.removeAccess(cu.id)}
                          disabled={crossAccess.isRemovingAccess}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-3">
                    Nenhum usuário externo com acesso compartilhado
                  </p>
                )}
              </div>
            </TabsContent>

            {/* PDVs Tab */}
            <TabsContent value="pdvs" className="mt-4 space-y-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={actions.createPdv.open}
              >
                <Plus className="h-4 w-4 mr-1" />
                Criar PDV
              </Button>
              {actions.pdvsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : actions.pdvs && actions.pdvs.length > 0 ? (
                <div className="space-y-2">
                  {actions.pdvs.map((pdv) => (
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            actions.editPdv.open(pdv);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            actions.deletePdv.open(pdv.id, pdv.name);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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

      {/* Delete User Confirmation */}
      <AlertDialog open={!!actions.deleteUser.targetId} onOpenChange={actions.deleteUser.close}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{actions.deleteUser.targetName}</strong>? Esta ação é permanente e não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actions.deleteUser.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={actions.deleteUser.isPending}
              onClick={actions.deleteUser.confirm}
            >
              {actions.deleteUser.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete PDV Confirmation */}
      <AlertDialog open={!!actions.deletePdv.targetId} onOpenChange={actions.deletePdv.close}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir PDV</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{actions.deletePdv.targetName}</strong>? Todos os dados associados (estoque, vendas, uploads) poderão ser afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actions.deletePdv.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={actions.deletePdv.isPending}
              onClick={actions.deletePdv.confirm}
            >
              {actions.deletePdv.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit PDV Dialog */}
      <Dialog open={actions.editPdv.isOpen} onOpenChange={() => actions.editPdv.close()}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar PDV</DialogTitle>
            <DialogDescription>Atualize as informações do PDV.</DialogDescription>
          </DialogHeader>
          {actions.organizations.length > 1 && (
            <div className="grid gap-2">
              <Label htmlFor="transfer-org">Transferir para organização</Label>
              <Select
                value={actions.editPdv.transferOrgId || organizationId}
                onValueChange={actions.editPdv.setTransferOrgId}
              >
                <SelectTrigger id="transfer-org">
                  <Building2 className="h-4 w-4 mr-2 flex-shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {actions.organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <PDVForm
            values={actions.editPdv.form}
            onChange={actions.editPdv.setForm}
            errors={actions.editPdv.errors}
            onClearError={actions.editPdv.clearError}
            idPrefix="edit-pdv-"
            isEditing
          />
          <DialogFooter>
            <Button variant="outline" onClick={actions.editPdv.close} disabled={actions.editPdv.isPending}>
              Cancelar
            </Button>
            <Button onClick={actions.editPdv.save} disabled={actions.editPdv.isPending}>
              {actions.editPdv.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Confirmation */}
      <AlertDialog open={actions.editPdv.showTransferConfirm} onOpenChange={actions.editPdv.setShowTransferConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar transferência</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span>Tem certeza que deseja transferir este PDV para outra organização?</span>
              <ul className="list-disc pl-5 mt-2 text-sm space-y-1">
                <li>Uploads, vendas e estoque associados permanecem vinculados ao PDV</li>
                <li>O PDV deixará de aparecer na organização atual</li>
                <li>Relatórios da organização de origem podem ser afetados</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actions.editPdv.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={actions.editPdv.isPending}
              onClick={actions.editPdv.confirmTransfer}
            >
              {actions.editPdv.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirmar Transferência
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create User Dialog */}
      <CreateUserDialog
        open={actions.createUser.isOpen}
        onOpenChange={(open) => !open && actions.createUser.close()}
        onSubmit={actions.createUser.submit}
        isLoading={actions.createUser.isPending}
        adminOrganizationId={organizationId}
        adminOrganizationName={organizationName}
        isSuperAdmin={true}
      />

      {/* Create PDV Dialog */}
      <Dialog open={actions.createPdv.isOpen} onOpenChange={actions.createPdv.close}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar PDV</DialogTitle>
            <DialogDescription>
              Adicione um novo PDV à organização <strong>{organizationName}</strong>.
            </DialogDescription>
          </DialogHeader>
          <PDVForm
            values={actions.createPdv.form}
            onChange={actions.createPdv.setForm}
            errors={actions.createPdv.errors}
            onClearError={actions.createPdv.clearError}
            idPrefix="create-pdv-"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => actions.createPdv.close(false)} disabled={actions.createPdv.isPending}>
              Cancelar
            </Button>
            <Button onClick={actions.createPdv.save} disabled={actions.createPdv.isPending}>
              {actions.createPdv.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Criar PDV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Cross-Org Access Dialog */}
      <AddOrgAccessDialog
        open={crossAccess.addAccess.isOpen}
        onOpenChange={crossAccess.addAccess.close}
        organizationName={organizationName}
        searchTerm={crossAccess.addAccess.searchTerm}
        onSearchChange={crossAccess.addAccess.setSearchTerm}
        accessLevel={crossAccess.addAccess.accessLevel}
        onAccessLevelChange={crossAccess.addAccess.setAccessLevel}
        results={crossAccess.addAccess.results}
        isSearching={crossAccess.addAccess.isSearching}
        onGrant={crossAccess.addAccess.grant}
        isGranting={crossAccess.addAccess.isGranting}
      />
    </>
  );
}
