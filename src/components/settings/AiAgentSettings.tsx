import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, KeyRound, Loader2, PlayCircle, RefreshCw, Sparkles, Wrench } from "lucide-react";
import { useAiAgentConfig } from "@/hooks/useAiAgentConfig";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function AiAgentSettings() {
  const { status, updateConfig, toggleTool, testKey, smokeTest } = useAiAgentConfig();
  const data = status.data;

  const [model, setModel] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [prompt, setPrompt] = useState("");
  const [maxIter, setMaxIter] = useState(8);
  const [historyLimit, setHistoryLimit] = useState(12);
  const [rateLimit, setRateLimit] = useState(20);
  const [maxChars, setMaxChars] = useState(4000);

  useEffect(() => {
    if (!data?.config) return;
    setModel(data.config.model);
    setReasoning(data.config.reasoning_effort);
    setPrompt(data.config.system_prompt);
    setMaxIter(data.config.max_tool_iterations);
    setHistoryLimit(data.config.history_limit);
    setRateLimit(data.config.rate_limit_per_10min);
    setMaxChars(data.config.max_message_chars);
  }, [data?.config]);

  if (status.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status.error || !data) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{(status.error as Error)?.message ?? "Falha ao carregar configurações."}</AlertDescription>
      </Alert>
    );
  }

  const cfg = data.config;
  const ks = data.key_status;
  const dirty =
    cfg &&
    (model !== cfg.model ||
      reasoning !== cfg.reasoning_effort ||
      prompt !== cfg.system_prompt ||
      maxIter !== cfg.max_tool_iterations ||
      historyLimit !== cfg.history_limit ||
      rateLimit !== cfg.rate_limit_per_10min ||
      maxChars !== cfg.max_message_chars);

  const statusBadge = ks?.last_test_status
    ? ks.last_test_status === "ok"
      ? <Badge className="bg-primary/15 text-primary hover:bg-primary/20">Operacional</Badge>
      : ks.last_test_status === "untested"
        ? <Badge variant="secondary">Não testada</Badge>
        : <Badge variant="destructive">{ks.last_test_status}</Badge>
    : <Badge variant="secondary">—</Badge>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">Agente IA</CardTitle>
            <CardDescription>
              Modelo, prompt e tools usadas pelo assistente em /assistente.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview"><Sparkles className="h-4 w-4 mr-1" /> Visão geral</TabsTrigger>
            <TabsTrigger value="prompt">Prompt</TabsTrigger>
            <TabsTrigger value="tools"><Wrench className="h-4 w-4 mr-1" /> Tools</TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="space-y-4">
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-3">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm font-medium">Chave OpenAI</div>
                  <div className="text-xs text-muted-foreground">
                    {ks?.key_prefix ? <code className="bg-muted px-1 rounded">{ks.key_prefix}</code> : "Prefixo não disponível"}
                    {ks?.last_tested_at && (
                      <span className="ml-2">
                        Testada {formatDistanceToNow(new Date(ks.last_tested_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    )}
                  </div>
                </div>
                {statusBadge}
                <Button size="sm" variant="outline" onClick={() => testKey.mutate()} disabled={testKey.isPending}>
                  {testKey.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Testar
                </Button>
              </div>
              {!data.openai_key_present && (
                <Alert variant="destructive">
                  <AlertDescription>OPENAI_API_KEY não está configurada nas secrets do projeto.</AlertDescription>
                </Alert>
              )}
              {ks?.last_test_message && ks.last_test_status !== "ok" && (
                <p className="text-xs text-destructive">{ks.last_test_message}</p>
              )}
            </div>

            <div className="rounded-lg border p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Modelo & limites</h4>
                <Button size="sm" variant="outline" onClick={() => smokeTest.mutate()} disabled={smokeTest.isPending}>
                  {smokeTest.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                  Smoke test
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Modelo</Label>
                  <Select value={model} onValueChange={setModel} disabled={!data.is_super_admin}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {data.available_models.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Reasoning effort</Label>
                  <Select value={reasoning} onValueChange={setReasoning} disabled={!data.is_super_admin}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {data.available_reasoning.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Iterações máx. de tools (1-15)</Label>
                  <Input type="number" min={1} max={15} value={maxIter} onChange={(e) => setMaxIter(Number(e.target.value))} disabled={!data.is_super_admin} />
                </div>
                <div className="space-y-1">
                  <Label>Histórico (mensagens, 1-30)</Label>
                  <Input type="number" min={1} max={30} value={historyLimit} onChange={(e) => setHistoryLimit(Number(e.target.value))} disabled={!data.is_super_admin} />
                </div>
                <div className="space-y-1">
                  <Label>Rate limit / 10min (1-200)</Label>
                  <Input type="number" min={1} max={200} value={rateLimit} onChange={(e) => setRateLimit(Number(e.target.value))} disabled={!data.is_super_admin} />
                </div>
                <div className="space-y-1">
                  <Label>Tamanho máx. mensagem (chars)</Label>
                  <Input type="number" min={100} max={10000} value={maxChars} onChange={(e) => setMaxChars(Number(e.target.value))} disabled={!data.is_super_admin} />
                </div>
              </div>
              {data.is_super_admin && (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    disabled={!dirty || updateConfig.isPending}
                    onClick={() => updateConfig.mutate({ model, reasoning_effort: reasoning, max_tool_iterations: maxIter, history_limit: historyLimit, rate_limit_per_10min: rateLimit, max_message_chars: maxChars })}
                  >
                    {updateConfig.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Salvar
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* PROMPT */}
          <TabsContent value="prompt" className="space-y-3">
            <Label>System prompt (skill core)</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={20}
              className="font-mono text-xs"
              disabled={!data.is_super_admin}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{prompt.length} caracteres</span>
              {data.is_super_admin && (
                <Button
                  size="sm"
                  disabled={!dirty || updateConfig.isPending}
                  onClick={() => updateConfig.mutate({ system_prompt: prompt })}
                >
                  {updateConfig.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Salvar prompt
                </Button>
              )}
            </div>
          </TabsContent>

          {/* TOOLS */}
          <TabsContent value="tools" className="space-y-2">
            {data.tools.map((t) => (
              <div key={t.name} className="flex items-start justify-between gap-3 p-3 rounded-lg border">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-xs font-medium">{t.name}</code>
                    <Badge variant="outline" className="text-xs">{t.category}</Badge>
                    {!t.enabled && <Badge variant="secondary" className="text-xs">desativada</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                </div>
                <Switch
                  checked={t.enabled}
                  disabled={!data.is_super_admin || toggleTool.isPending}
                  onCheckedChange={(checked) => toggleTool.mutate({ name: t.name, enabled: checked })}
                />
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}