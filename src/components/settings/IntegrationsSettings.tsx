import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ExternalLink, Key, Cloud, FileSpreadsheet, Plus, Copy, Check, Trash2, Ban, Loader2, Info } from "lucide-react";
import { useApiKeys } from "@/hooks/useApiKeys";
import { useProfile } from "@/hooks/useProfile";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function IntegrationsSettings() {
  const { isAdmin } = useProfile();
  const { apiKeys, isLoading, createKey, revokeKey, deleteKey, isAllOrgs } = useApiKeys();
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast.error("Informe um nome para a API Key");
      return;
    }
    const rawKey = await createKey.mutateAsync(newKeyName.trim());
    setCreatedKey(rawKey);
    setNewKeyName("");
    setCreateDialogOpen(false);
    setKeyDialogOpen(true);
  };

  const handleCopyKey = async () => {
    if (createdKey) {
      await navigator.clipboard.writeText(createdKey);
      setCopied(true);
      toast.success("API Key copiada!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleKeyDialogClose = () => {
    setKeyDialogOpen(false);
    setCreatedKey(null);
    setCopied(false);
  };

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

      {/* API Keys — admin only */}
      {isAdmin && <Card>
        {isAllOrgs ? (
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Key className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base">API Keys</CardTitle>
                <CardDescription>
                  Autentique chamadas à API de ingestão de dados
                </CardDescription>
              </div>
            </div>
            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Selecione uma organização específica no seletor acima para gerenciar API Keys.
              </AlertDescription>
            </Alert>
          </CardHeader>
        ) : (
        <>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Key className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">API Keys</CardTitle>
              <CardDescription>
                Autentique chamadas à API de ingestão de dados
              </CardDescription>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nova Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova API Key</DialogTitle>
                  <DialogDescription>
                    Dê um nome descritivo para identificar esta chave.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="key-name">Nome</Label>
                    <Input
                      id="key-name"
                      placeholder="Ex: Script de vendas, Cron job"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreateKey()}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleCreateKey}
                    disabled={createKey.isPending || !newKeyName.trim()}
                    className="gap-2"
                  >
                    {createKey.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Gerar API Key
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : apiKeys.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              Nenhuma API Key criada. Crie uma para começar a enviar dados via API.
            </p>
          ) : (
            <div className="space-y-2">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{key.name}</span>
                      {!key.is_active && (
                        <Badge variant="destructive" className="text-xs">Revogada</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <code className="bg-muted px-1.5 py-0.5 rounded">{key.key_prefix}...</code>
                      <span>
                        {key.last_used_at
                          ? `Usado ${formatDistanceToNow(new Date(key.last_used_at), { addSuffix: true, locale: ptBR })}`
                          : "Nunca usado"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {key.is_active && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" title="Revogar">
                            <Ban className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revogar API Key?</AlertDialogTitle>
                            <AlertDialogDescription>
                              A chave "{key.name}" será desativada e não poderá mais ser usada para autenticação.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => revokeKey.mutate(key.id)}>
                              Revogar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" title="Excluir">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir API Key?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteKey.mutate(key.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* API Docs inline */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <h4 className="text-sm font-medium">Endpoint de Ingestão</h4>
            <code className="block text-xs bg-muted p-2 rounded break-all">
              POST {import.meta.env.VITE_SUPABASE_URL}/functions/v1/ingest-revenue
            </code>
            <p className="text-xs text-muted-foreground">
              Envie registros individuais de venda via JSON. Header: <code className="bg-muted px-1 rounded">Authorization: Bearer &lt;api_key&gt;</code>
            </p>
            <details className="text-xs">
              <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground">
                Ver exemplo de body
              </summary>
              <pre className="mt-2 bg-muted p-2 rounded overflow-x-auto text-xs">
{`{
  "device_id": "ABC123",
  "order_number": "ORD-001",
  "product_name": "APPLE iPhone 15 Pro Max",
  "payment_date": "2025-01-15T14:30:00",
  "amount": 69.90,
  "payment_method": "PIX",
  "status": "Aprovado"
}`}
              </pre>
              <p className="mt-1 text-muted-foreground">
                <strong>Obrigatórios:</strong> device_id, order_number, product_name, payment_date, amount
              </p>
            </details>
          </div>
        </CardContent>
        </>
        )}
      </Card>}

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

      {/* Created Key Dialog */}
      <Dialog open={keyDialogOpen} onOpenChange={handleKeyDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Criada</DialogTitle>
            <DialogDescription>
              Copie a chave abaixo. Ela <strong>não será exibida novamente</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={createdKey || ""}
                className="font-mono text-xs"
              />
              <Button variant="outline" size="icon" onClick={handleCopyKey}>
                {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleKeyDialogClose}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
