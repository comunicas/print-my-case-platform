import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useTheme } from "next-themes";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User, Settings as SettingsIcon, Building2, Plug, Camera, Lock, ExternalLink, Key, Cloud, FileSpreadsheet, Loader2, MapPin, Users } from "lucide-react";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength";
import { PDVsSettings } from "@/components/settings/PDVsSettings";
import { TeamSettings } from "@/components/settings/TeamSettings";
import { toast } from "@/hooks/use-toast";
import { profileFormSchema, passwordFormSchema, organizationFormSchema } from "@/lib/schemas/settings";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useOrganization } from "@/hooks/useOrganization";
import { usePreferences } from "@/hooks/usePreferences";
import { usePDVs } from "@/hooks/usePDVs";
import { supabase } from "@/integrations/supabase/client";

const roleLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  super_admin: { label: "Super Admin", variant: "default" },
  org_admin: { label: "Administrador", variant: "default" },
  operator: { label: "Operador", variant: "secondary" },
  viewer: { label: "Visualizador", variant: "outline" },
};

export default function Settings() {
  const [searchParams] = useSearchParams();
  const { theme, setTheme } = useTheme();
  const { session } = useAuth();
  const { profile, role, isAdmin, isLoading: profileLoading, updateProfile } = useProfile();
  const { organization, isLoading: orgLoading, updateOrganization } = useOrganization();
  const { preferences, isLoading: prefsLoading, updatePreferences } = usePreferences();
  const { pdvs, isLoading: pdvsLoading } = usePDVs();
  
  const [activeTab, setActiveTab] = useState(() => {
    const tabFromUrl = searchParams.get("tab");
    return tabFromUrl || "profile";
  });
  
  // Profile state
  const [profileData, setProfileData] = useState({
    name: "",
    phone: "",
  });
  
  // Password dialog state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Organization state
  const [orgData, setOrgData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  
  // Preferences state (nested structure for UI)
  const [localPreferences, setLocalPreferences] = useState({
    theme: "system" as string,
    language: "pt-BR" as string,
    notifications: {
      email: true,
      stockAlerts: true,
      weeklyReports: false,
      uploadProcessed: true,
    },
    dashboard: {
      defaultPeriod: "30days" as string,
      defaultPdv: "all",
    },
  });

  // Error states
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [orgErrors, setOrgErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setProfileData({
        name: profile.name || "",
        phone: profile.phone || "",
      });
    }
  }, [profile]);

  // Initialize organization data
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

  // Initialize preferences data
  useEffect(() => {
    if (preferences) {
      setLocalPreferences({
        theme: preferences.theme || "system",
        language: preferences.language || "pt-BR",
        notifications: {
          email: preferences.email_notifications ?? true,
          stockAlerts: preferences.stock_alerts ?? true,
          weeklyReports: preferences.weekly_reports ?? false,
          uploadProcessed: preferences.upload_notifications ?? true,
        },
        dashboard: {
          defaultPeriod: preferences.default_period || "30days",
          defaultPdv: preferences.default_pdv || "all",
        },
      });
    }
  }, [preferences]);

  const isLoading = profileLoading || orgLoading || prefsLoading;

  const initials = profile?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "??";

  const handleSaveProfile = () => {
    const result = profileFormSchema.safeParse(profileData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
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
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setPasswordErrors(errors);
      return;
    }
    
    setPasswordErrors({});
    setIsChangingPassword(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });
      
      if (error) throw error;
      
      setPasswordDialogOpen(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast({
        title: "Senha alterada",
        description: "Sua senha foi atualizada com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao alterar senha",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

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
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
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

  const handleSavePreferences = () => {
    updatePreferences.mutate({
      theme: localPreferences.theme,
      language: localPreferences.language,
      email_notifications: localPreferences.notifications.email,
      stock_alerts: localPreferences.notifications.stockAlerts,
      weekly_reports: localPreferences.notifications.weeklyReports,
      upload_notifications: localPreferences.notifications.uploadProcessed,
      default_period: localPreferences.dashboard.defaultPeriod,
      default_pdv: localPreferences.dashboard.defaultPdv === "all" ? null : localPreferences.dashboard.defaultPdv,
    });
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

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie suas preferências e dados da organização
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto">
            <TabsTrigger value="profile" className="gap-2 py-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2 py-2">
              <SettingsIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Preferências</span>
            </TabsTrigger>
            <TabsTrigger value="organization" className="gap-2 py-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Organização</span>
            </TabsTrigger>
            <TabsTrigger value="pdvs" className="gap-2 py-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">PDVs</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="team" className="gap-2 py-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Equipe</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="integrations" className="gap-2 py-2">
              <Plug className="h-4 w-4" />
              <span className="hidden sm:inline">Integrações</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
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
                      <Badge variant={roleLabels[role || "viewer"]?.variant || "outline"}>
                        {roleLabels[role || "viewer"]?.label || role}
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
                    <DialogContent>
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
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            {/* Appearance */}
            <Card>
              <CardHeader>
                <CardTitle>Aparência</CardTitle>
                <CardDescription>
                  Personalize a aparência do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Tema</Label>
                  <RadioGroup
                    value={theme}
                    onValueChange={(value) => setTheme(value)}
                    className="grid grid-cols-3 gap-4"
                  >
                    <div>
                      <RadioGroupItem value="light" id="light" className="peer sr-only" />
                      <Label
                        htmlFor="light"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <span className="text-2xl mb-2">☀️</span>
                        <span className="text-sm font-medium">Claro</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                      <Label
                        htmlFor="dark"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <span className="text-2xl mb-2">🌙</span>
                        <span className="text-sm font-medium">Escuro</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="system" id="system" className="peer sr-only" />
                      <Label
                        htmlFor="system"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <span className="text-2xl mb-2">💻</span>
                        <span className="text-sm font-medium">Sistema</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Idioma</Label>
                  <Select
                    value={localPreferences.language}
                    onValueChange={(value) =>
                      setLocalPreferences({ ...localPreferences, language: value })
                    }
                  >
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (BR)</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>Notificações</CardTitle>
                <CardDescription>
                  Configure quais notificações você deseja receber
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações por email</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba atualizações importantes por email
                    </p>
                  </div>
                  <Switch
                    checked={localPreferences.notifications.email}
                    onCheckedChange={(checked) =>
                      setLocalPreferences({
                        ...localPreferences,
                        notifications: { ...localPreferences.notifications, email: checked },
                      })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Alertas de estoque baixo</Label>
                    <p className="text-sm text-muted-foreground">
                      Seja notificado quando produtos estiverem acabando
                    </p>
                  </div>
                  <Switch
                    checked={localPreferences.notifications.stockAlerts}
                    onCheckedChange={(checked) =>
                      setLocalPreferences({
                        ...localPreferences,
                        notifications: { ...localPreferences.notifications, stockAlerts: checked },
                      })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Relatórios semanais</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba um resumo semanal de vendas e estoque
                    </p>
                  </div>
                  <Switch
                    checked={localPreferences.notifications.weeklyReports}
                    onCheckedChange={(checked) =>
                      setLocalPreferences({
                        ...localPreferences,
                        notifications: { ...localPreferences.notifications, weeklyReports: checked },
                      })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Uploads processados</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifique quando um upload for processado
                    </p>
                  </div>
                  <Switch
                    checked={localPreferences.notifications.uploadProcessed}
                    onCheckedChange={(checked) =>
                      setLocalPreferences({
                        ...localPreferences,
                        notifications: { ...localPreferences.notifications, uploadProcessed: checked },
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Dashboard Defaults */}
            <Card>
              <CardHeader>
                <CardTitle>Padrões do Dashboard</CardTitle>
                <CardDescription>
                  Configure os valores padrão para visualização
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="defaultPeriod">Período padrão</Label>
                    <Select
                      value={localPreferences.dashboard.defaultPeriod}
                      onValueChange={(value) =>
                        setLocalPreferences({
                          ...localPreferences,
                          dashboard: { ...localPreferences.dashboard, defaultPeriod: value },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Hoje</SelectItem>
                        <SelectItem value="7days">Últimos 7 dias</SelectItem>
                        <SelectItem value="30days">Últimos 30 dias</SelectItem>
                        <SelectItem value="thisMonth">Este mês</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="defaultPdv">PDV padrão</Label>
                    <Select
                      value={localPreferences.dashboard.defaultPdv}
                      onValueChange={(value) =>
                        setLocalPreferences({
                          ...localPreferences,
                          dashboard: { ...localPreferences.dashboard, defaultPdv: value },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os PDVs</SelectItem>
                        {pdvs.map((pdv) => (
                          <SelectItem key={pdv.id} value={pdv.id}>
                            {pdv.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSavePreferences}
                    disabled={updatePreferences.isPending}
                  >
                    {updatePreferences.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Salvar Preferências
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Organization Tab */}
          <TabsContent value="organization" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dados da Empresa</CardTitle>
                <CardDescription>
                  Informações da sua organização
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Nome da organização</Label>
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
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input id="cnpj" value={organization?.cnpj || "Não informado"} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgEmail">Email comercial</Label>
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
                      className={orgErrors.phone ? "border-destructive" : ""}
                    />
                    {orgErrors.phone && (
                      <p className="text-sm text-destructive">{orgErrors.phone}</p>
                    )}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      value={orgData.address}
                      onChange={(e) => {
                        setOrgData({ ...orgData, address: e.target.value });
                        if (orgErrors.address) setOrgErrors({ ...orgErrors, address: "" });
                      }}
                      disabled={!isAdmin}
                      className={orgErrors.address ? "border-destructive" : ""}
                    />
                    {orgErrors.address && (
                      <p className="text-sm text-destructive">{orgErrors.address}</p>
                    )}
                  </div>
                </div>
                {!isAdmin && (
                  <p className="text-sm text-muted-foreground">
                    Apenas administradores podem editar dados da organização.
                  </p>
                )}
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
              </CardContent>
            </Card>

            {/* Plan & Billing */}
            <Card>
              <CardHeader>
                <CardTitle>Plano e Faturamento</CardTitle>
                <CardDescription>
                  Gerencie seu plano e informações de cobrança
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Plano atual:</span>
                      <Badge>{organization?.plan || "Gratuito"}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {organization?.active_since 
                        ? `Ativo desde: ${new Date(organization.active_since).toLocaleDateString("pt-BR")}` 
                        : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" disabled className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Gerenciar Plano
                  </Button>
                  <Button variant="outline" disabled className="gap-2">
                    Ver Faturas
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Active PDVs */}
            <Card>
              <CardHeader>
                <CardTitle>PDVs Ativos</CardTitle>
                <CardDescription>
                  Pontos de venda vinculados à sua organização
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pdvsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : pdvs.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    Nenhum PDV cadastrado.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {pdvs.filter(p => p.status === "active").slice(0, 5).map((pdv) => (
                      <div
                        key={pdv.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div>
                          <p className="font-medium">{pdv.name}</p>
                          <p className="text-sm text-muted-foreground">{pdv.machine_id}</p>
                        </div>
                        <Badge variant="secondary">Ativo</Badge>
                      </div>
                    ))}
                  </div>
                )}
                <Button variant="link" className="mt-4 px-0" onClick={() => setActiveTab("pdvs")}>
                  Ver todos os PDVs →
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PDVs Tab */}
          <TabsContent value="pdvs" className="space-y-6">
            <PDVsSettings />
          </TabsContent>

          {/* Team Tab */}
          {isAdmin && (
            <TabsContent value="team" className="space-y-6">
              <TeamSettings />
            </TabsContent>
          )}

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Google Drive
                </CardTitle>
                <CardDescription>
                  Sincronize planilhas automaticamente do Google Drive
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Desconectado</Badge>
                  </div>
                  <Button disabled className="gap-2">
                    Conectar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="h-5 w-5" />
                  Backend (Lovable Cloud)
                </CardTitle>
                <CardDescription>
                  Banco de dados para persistência de dados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500 hover:bg-green-600">Conectado</Badge>
                  </div>
                  <Button variant="outline" disabled className="gap-2">
                    Configurado
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API & Webhooks
                </CardTitle>
                <CardDescription>
                  Gere chaves de API para integrações personalizadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Crie chaves para integrar com sistemas externos
                    </p>
                  </div>
                  <Button disabled className="gap-2">
                    Gerar Chave
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
