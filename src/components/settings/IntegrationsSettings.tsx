import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Key, Cloud, FileSpreadsheet } from "lucide-react";

export function IntegrationsSettings() {
  return (
    <div className="space-y-6">
      {/* Google Drive */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Google Drive</CardTitle>
              <CardDescription>
                Importe planilhas diretamente do Google Drive
              </CardDescription>
            </div>
            <Badge variant="secondary">Em breve</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Button variant="outline" disabled className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Conectar
          </Button>
        </CardContent>
      </Card>

      {/* API */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Key className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">API</CardTitle>
              <CardDescription>
                Integre seus sistemas com nossa API REST
              </CardDescription>
            </div>
            <Badge variant="secondary">Em breve</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Button variant="outline" disabled className="gap-2">
            <Key className="h-4 w-4" />
            Gerar chave
          </Button>
        </CardContent>
      </Card>

      {/* Webhook */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Cloud className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Webhooks</CardTitle>
              <CardDescription>
                Receba notificações em tempo real
              </CardDescription>
            </div>
            <Badge variant="secondary">Em breve</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Button variant="outline" disabled className="gap-2">
            Configurar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
