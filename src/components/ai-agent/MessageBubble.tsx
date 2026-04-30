import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { Sparkles, User } from "lucide-react";
import type { AiMessage } from "@/hooks/useAiMessages";

interface Props {
  message: AiMessage;
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <Sparkles className="h-4 w-4" />
        </div>
      )}
      <div
        className={cn(
          "rounded-2xl px-4 py-3 max-w-[85%] md:max-w-[75%] text-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground",
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert prose-table:text-xs prose-th:px-2 prose-td:px-2 prose-headings:mt-2 prose-headings:mb-1 prose-p:my-1">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              skipHtml
              disallowedElements={["script", "iframe", "style", "object", "embed"]}
            >
              {message.content || "_(sem conteúdo)_"}
            </ReactMarkdown>
          </div>
        )}
        {message.status !== "ok" && (
          <p className="text-xs opacity-70 mt-1">
            {message.status === "aborted" ? "Resposta interrompida" : "Falha na resposta"}
          </p>
        )}
      </div>
      {isUser && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
