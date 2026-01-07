import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Camera, Lock, Loader2 } from "lucide-react";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength";
import { toast } from "sonner";
import { profileFormSchema, passwordFormSchema } from "@/lib/schemas/settings";
import { roleLabels, roleBadgeVariants, TeamMemberRole } from "@/lib/schemas/team";
import { parseZodErrors, getInitials } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Session } from "@supabase/supabase-js";
import { UseMutationResult } from "@tanstack/react-query";

interface ProfileSettingsProps {
  profile: Tables<"profiles"> | null;
  role: string | null;
  session: Session | null;
  updateProfile: UseMutationResult<Tables<"profiles">, Error, Partial<Tables<"profiles">>>;
}

export function ProfileSettings({ profile, role, session, updateProfile }: ProfileSettingsProps) {
  const [profileData, setProfileData] = useState({
    name: "",
    phone: "",
  });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setProfileData({
        name: profile.name || "",
        phone: profile.phone || "",
      });
    }
  }, [profile]);

  const initials = getInitials(profile?.name || "??");

  const handleSaveProfile = () => {
    const result = profileFormSchema.safeParse(profileData);
    const errors = parseZodErrors(result);
    if (errors) {
      setProfileErrors(errors);
      return;
    }
    setProfileErrors({});
    
    updateProfile.mutate({
      name: profileData.name.trim(),
      phone: profileData.phone || null,
    });
  };

  const handleChangePassword = async () => {
    const result = passwordFormSchema.safeParse(passwordData);
    const errors = parseZodErrors(result);
    if (errors) {
      setPasswordErrors(errors);
      return;
    }
    
    setPasswordErrors({});
    setIsChangingPassword(true);
    
    try {
      // Use server-side Edge Function for password validation
      const { data, error } = await supabase.functions.invoke('update-password', {
        body: { newPassword: passwordData.newPassword }
      });
      
      if (error) {
        throw new Error(error.message || 'Erro ao atualizar senha');
      }
      
      if (data?.error) {
        throw new Error(data.error);
      }
      
      setPasswordDialogOpen(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Senha alterada", {
        description: "Sua senha foi atualizada com sucesso.",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error("Erro ao alterar senha", {
        description: errorMessage,
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const formatLastLogin = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
          <CardDescription>
            Atualize suas informações de perfil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback className="text-lg bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <Button variant="outline" size="sm" className="gap-2" disabled>
                <Camera className="h-4 w-4" />
                Alterar foto
              </Button>
              <p className="text-xs text-muted-foreground">
                JPG, PNG ou GIF. Máximo 2MB.
              </p>
            </div>
          </div>

          <Separator />

          {/* Form fields */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => {
                  setProfileData({ ...profileData, name: e.target.value });
                  if (profileErrors.name) setProfileErrors({ ...profileErrors, name: "" });
                }}
                className={profileErrors.name ? "border-destructive" : ""}
              />
              {profileErrors.name && (
                <p className="text-sm text-destructive">{profileErrors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="email"
                  value={profile?.email || ""}
                  disabled
                  className="flex-1"
                />
                <Badge variant="secondary" className="shrink-0">
                  Verificado
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Função</Label>
              <div className="flex items-center h-10">
                <Badge variant={roleBadgeVariants[(role as TeamMemberRole) || "viewer"] || "outline"}>
                  {roleLabels[(role as TeamMemberRole) || "viewer"] || role}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <PhoneInput
                id="phone"
                value={profileData.phone}
                onChange={(value) => {
                  setProfileData({ ...profileData, phone: value });
                  if (profileErrors.phone) setProfileErrors({ ...profileErrors, phone: "" });
                }}
                placeholder="(00) 00000-0000"
                className={profileErrors.phone ? "border-destructive" : ""}
              />
              {profileErrors.phone && (
                <p className="text-sm text-destructive">{profileErrors.phone}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={handleSaveProfile}
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Salvar Alterações
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Card */}
      <Card>
        <CardHeader>
          <CardTitle>Segurança</CardTitle>
          <CardDescription>
            Gerencie sua senha e segurança da conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Senha</p>
              <p className="text-sm text-muted-foreground">
                Último acesso: {session?.user?.last_sign_in_at 
                  ? formatLastLogin(session.user.last_sign_in_at) 
                  : "Primeiro acesso"}
              </p>
            </div>
            <Dialog open={passwordDialogOpen} onOpenChange={(open) => {
              setPasswordDialogOpen(open);
              if (!open) {
                setPasswordErrors({});
                setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
              }
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Lock className="h-4 w-4" />
                  Alterar Senha
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[425px] max-h-[90vh] overflow-y-auto overflow-x-hidden">
                <DialogHeader>
                  <DialogTitle>Alterar Senha</DialogTitle>
                  <DialogDescription>
                    Digite sua senha atual e a nova senha desejada
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Senha atual</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => {
                        setPasswordData({ ...passwordData, currentPassword: e.target.value });
                        if (passwordErrors.currentPassword) setPasswordErrors({ ...passwordErrors, currentPassword: "" });
                      }}
                      className={passwordErrors.currentPassword ? "border-destructive" : ""}
                    />
                    {passwordErrors.currentPassword && (
                      <p className="text-sm text-destructive">{passwordErrors.currentPassword}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova senha</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => {
                        setPasswordData({ ...passwordData, newPassword: e.target.value });
                        if (passwordErrors.newPassword) setPasswordErrors({ ...passwordErrors, newPassword: "" });
                      }}
                      className={passwordErrors.newPassword ? "border-destructive" : ""}
                    />
                    {passwordErrors.newPassword && (
                      <p className="text-sm text-destructive">{passwordErrors.newPassword}</p>
                    )}
                    {passwordData.newPassword && (
                      <PasswordStrengthIndicator password={passwordData.newPassword} />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => {
                        setPasswordData({ ...passwordData, confirmPassword: e.target.value });
                        if (passwordErrors.confirmPassword) setPasswordErrors({ ...passwordErrors, confirmPassword: "" });
                      }}
                      className={passwordErrors.confirmPassword ? "border-destructive" : ""}
                    />
                    {passwordErrors.confirmPassword && (
                      <p className="text-sm text-destructive">{passwordErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleChangePassword} disabled={isChangingPassword}>
                    {isChangingPassword && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Salvar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
