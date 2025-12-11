import { useState } from "react";
import { useTheme } from "next-themes";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User, Settings as SettingsIcon, Building2, Plug, Camera, Lock, ExternalLink, Key, Cloud, FileSpreadsheet } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { pdvList } from "@/lib/mock-data";

// Mock Data
const mockCurrentUser = {
  id: "user-1",
  name: "João Silva",
  email: "joao@printmycase.com",
  phone: "(11) 99999-9999",
  role: "org_admin" as const,
  avatar: "",
  lastLogin: "2024-12-10T14:32:00",
};

const mockOrganization = {
  id: "org-1",
  name: "Print My Case SP",
  cnpj: "12.345.678/0001-90",
  email: "contato@printmycase.com.br",
  phone: "(11) 3333-4444",
  address: "Av. Paulista, 1000 - São Paulo, SP",
  plan: "professional",
  planExpiry: "2025-01-15",
};

const mockPreferences = {
  theme: "system" as "light" | "dark" | "system",
  language: "pt-BR" as "pt-BR" | "en" | "es",
  notifications: {
    email: true,
    stockAlerts: true,
    weeklyReports: false,
    uploadProcessed: true,
  },
  dashboard: {
    defaultPeriod: "30days" as "today" | "7days" | "30days" | "thisMonth",
    defaultPdv: "all",
  },
};

const roleLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  super_admin: { label: "Super Admin", variant: "default" },
  org_admin: { label: "Administrador", variant: "default" },
  pdv_manager: { label: "Gerente PDV", variant: "secondary" },
  operator: { label: "Operador", variant: "secondary" },
  viewer: { label: "Visualizador", variant: "outline" },
};

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("profile");
  
  // Profile state
  const [profileData, setProfileData] = useState({
    name: mockCurrentUser.name,
    phone: mockCurrentUser.phone,
  });
  
  // Password dialog state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  // Organization state
  const [orgData, setOrgData] = useState({
    name: mockOrganization.name,
    email: mockOrganization.email,
    phone: mockOrganization.phone,
    address: mockOrganization.address,
  });
  
  // Preferences state
  const [preferences, setPreferences] = useState(mockPreferences);

  const initials = mockCurrentUser.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSaveProfile = () => {
    toast({
      title: "Perfil atualizado",
      description: "Suas informações foram salvas com sucesso.",
    });
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }
    setPasswordDialogOpen(false);
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    toast({
      title: "Senha alterada",
      description: "Sua senha foi atualizada com sucesso.",
    });
  };

  const handleSaveOrganization = () => {
    toast({
      title: "Organização atualizada",
      description: "Os dados da organização foram salvos com sucesso.",
    });
  };

  const handleSavePreferences = () => {
    toast({
      title: "Preferências salvas",
      description: "Suas preferências foram atualizadas.",
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
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
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
                    <AvatarImage src={mockCurrentUser.avatar} />
                    <AvatarFallback className="text-lg bg-primary/10 text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <Button variant="outline" size="sm" className="gap-2">
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
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="email"
                        value={mockCurrentUser.email}
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
                      <Badge variant={roleLabels[mockCurrentUser.role]?.variant || "default"}>
                        {roleLabels[mockCurrentUser.role]?.label || mockCurrentUser.role}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile}>Salvar Alterações</Button>
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
                      Último acesso: {formatLastLogin(mockCurrentUser.lastLogin)}
                    </p>
                  </div>
                  <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
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
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">Nova senha</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleChangePassword}>Salvar</Button>
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
                    value={preferences.language}
                    onValueChange={(value: "pt-BR" | "en" | "es") =>
                      setPreferences({ ...preferences, language: value })
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
                    checked={preferences.notifications.email}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        notifications: { ...preferences.notifications, email: checked },
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
                    checked={preferences.notifications.stockAlerts}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        notifications: { ...preferences.notifications, stockAlerts: checked },
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
                    checked={preferences.notifications.weeklyReports}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        notifications: { ...preferences.notifications, weeklyReports: checked },
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
                    checked={preferences.notifications.uploadProcessed}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        notifications: { ...preferences.notifications, uploadProcessed: checked },
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
                      value={preferences.dashboard.defaultPeriod}
                      onValueChange={(value: "today" | "7days" | "30days" | "thisMonth") =>
                        setPreferences({
                          ...preferences,
                          dashboard: { ...preferences.dashboard, defaultPeriod: value },
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
                      value={preferences.dashboard.defaultPdv}
                      onValueChange={(value) =>
                        setPreferences({
                          ...preferences,
                          dashboard: { ...preferences.dashboard, defaultPdv: value },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os PDVs</SelectItem>
                        {pdvList.map((pdv) => (
                          <SelectItem key={pdv.id} value={pdv.id}>
                            {pdv.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSavePreferences}>Salvar Preferências</Button>
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
                      onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input id="cnpj" value={mockOrganization.cnpj} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgEmail">Email comercial</Label>
                    <Input
                      id="orgEmail"
                      type="email"
                      value={orgData.email}
                      onChange={(e) => setOrgData({ ...orgData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgPhone">Telefone</Label>
                    <Input
                      id="orgPhone"
                      value={orgData.phone}
                      onChange={(e) => setOrgData({ ...orgData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      value={orgData.address}
                      onChange={(e) => setOrgData({ ...orgData, address: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveOrganization}>Salvar Alterações</Button>
                </div>
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
                      <Badge>Profissional</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Próximo vencimento: 15/01/2025
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
                <div className="space-y-2">
                  {pdvList.slice(0, 5).map((pdv) => (
                    <div
                      key={pdv.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">{pdv.name}</p>
                        <p className="text-sm text-muted-foreground">{pdv.code}</p>
                      </div>
                      <Badge variant="secondary">Ativo</Badge>
                    </div>
                  ))}
                </div>
                <Button variant="link" className="mt-4 px-0" asChild>
                  <a href="/pdvs">Ver todos os PDVs →</a>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

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
                  Conecte ao banco de dados para persistência de dados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Não configurado</Badge>
                  </div>
                  <Button disabled className="gap-2">
                    Configurar
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
                    <Key className="h-4 w-4" />
                    Gerar Chave API
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
