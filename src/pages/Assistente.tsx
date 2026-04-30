import { AppLayout } from "@/components/layout/AppLayout";
import { AgentChatPanel } from "@/components/ai-agent/AgentChatPanel";
import { useProfile } from "@/hooks/useProfile";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function Assistente() {
  const { role, isLoading } = useProfile();

  if (isLoading) {
    return (
      <AppLayout fullHeight>
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
    <AppLayout fullHeight>
      <div className="flex flex-col gap-2 sm:gap-3 flex-1 min-h-0">
        <div className="flex items-baseline justify-between gap-2 shrink-0">
          <h1 className="text-xl sm:text-2xl font-bold">Assistente IA</h1>
          <p className="hidden md:block text-xs text-muted-foreground truncate">
            Pergunte sobre estoque, vendas e otimização de PDVs.
          </p>
        </div>
        <AgentChatPanel />
      </div>
    </AppLayout>
  );
}
