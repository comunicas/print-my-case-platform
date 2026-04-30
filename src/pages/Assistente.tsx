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
        <div className="flex flex-1 min-h-0 items-center justify-center">
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
      <AgentChatPanel />
    </AppLayout>
  );
}
