import { AppLayout } from "@/components/layout/AppLayout";
import { AgentChatPanel } from "@/components/ai-agent/AgentChatPanel";
import { useProfile } from "@/hooks/useProfile";
import { Navigate } from "react-router-dom";
import { Loader2, Sparkles } from "lucide-react";

export default function Assistente() {
  const { role, isLoading } = useProfile();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (role !== "super_admin" && role !== "org_admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Assistente IA</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Pergunte sobre estoque, vendas, faturamento e otimização de PDVs com base nos seus dados em tempo real.
        </p>
        <AgentChatPanel />
      </div>
    </AppLayout>
  );
}
