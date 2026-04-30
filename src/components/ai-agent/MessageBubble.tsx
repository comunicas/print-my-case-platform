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
    <div
      className={cn(
        "flex gap-2 sm:gap-3 w-full min-w-0",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <Sparkles className="h-4 w-4" />
        </div>
      )}
      <div
        className={cn(
          "rounded-2xl px-3 py-2 sm:px-4 sm:py-3 text-sm min-w-0 overflow-hidden",
          isUser
            ? "max-w-[calc(100%-2.75rem)] sm:max-w-[80%] md:max-w-[75%] bg-primary text-primary-foreground"
            : "max-w-[calc(100%-2.75rem)] sm:max-w-[85%] md:max-w-[80%] bg-muted text-foreground",
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <div
            className={cn(
              "prose prose-sm max-w-none dark:prose-invert",
              "prose-headings:mt-2 prose-headings:mb-1 prose-p:my-1",
              "prose-pre:my-2 prose-pre:overflow-x-auto prose-pre:text-xs",
              "prose-code:break-words prose-code:text-[12px]",
              "prose-a:break-all",
              "[&_p]:break-words [&_li]:break-words [&_h1]:break-words [&_h2]:break-words [&_h3]:break-words",
            )}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              skipHtml
              disallowedElements={["script", "iframe", "style", "object", "embed"]}
              components={{
                table: ({ node, ...props }) => (
                  <div className="my-2 -mx-1 max-w-full overflow-x-auto rounded-md border border-border/50">
                    <table {...props} className="min-w-full text-xs" />
                  </div>
                ),
                th: ({ node, ...props }) => (
                  <th {...props} className="whitespace-nowrap px-2 py-1 text-left font-medium" />
                ),
                td: ({ node, ...props }) => (
                  <td {...props} className="whitespace-nowrap px-2 py-1 align-top" />
                ),
                pre: ({ node, ...props }) => (
                  <pre {...props} className="overflow-x-auto rounded-md bg-background/60 p-2 text-xs" />
                ),
                code: ({ node, className, children, ...props }) => (
                  <code {...props} className={cn(className, "break-words")}>
                    {children}
                  </code>
                ),
              }}
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
