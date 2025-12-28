import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { PDV } from "@/hooks/usePDVs";
import { UseMutationResult } from "@tanstack/react-query";

interface PreferencesSettingsProps {
  preferences: Tables<"preferences"> | null;
  pdvs: PDV[];
  updatePreferences: UseMutationResult<Tables<"preferences">, Error, Partial<Tables<"preferences">>>;
}

export function PreferencesSettings({ preferences, pdvs, updatePreferences }: PreferencesSettingsProps) {
  const { theme, setTheme } = useTheme();
  
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

  return (
    <div className="space-y-6">
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
                  <SelectItem value="7days">Últimos 7 dias</SelectItem>
                  <SelectItem value="14days">Últimos 14 dias</SelectItem>
                  <SelectItem value="30days">Últimos 30 dias</SelectItem>
                  <SelectItem value="90days">Últimos 90 dias</SelectItem>
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
    </div>
  );
}
