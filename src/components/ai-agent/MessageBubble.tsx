import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { Sparkles, User, Copy, Check, ThumbsUp, ThumbsDown } from "lucide-react";
import type { AiMessage } from "@/hooks/useAiMessages";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";


const TABLE_SEPARATOR_CELL = "---";

const isMarkdownSeparatorLine = (line: string) => {
  const trimmed = line.trim();
  if (!trimmed.includes("|")) return false;

  const cells = trimmed
    .split("|")
    .map((cell) => cell.trim())
    .filter(Boolean);

  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
};

const countTableCells = (line: string) => {
  const trimmed = line.trim();
  const hasLeadingPipe = trimmed.startsWith("|");
  const hasTrailingPipe = trimmed.endsWith("|");

  return trimmed
    .split("|")
    .map((cell, index, arr) => {
      if (index === 0 && hasLeadingPipe) return "";
      if (index === arr.length - 1 && hasTrailingPipe) return "";
      return cell.trim();
    })
    .filter((cell) => cell.length > 0).length;
};

const hasClearTablePattern = (lines: string[]) => {
  if (lines.length < 2) return false;
  const candidateLines = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => line.includes("|"));
  if (candidateLines.length < 2) return false;

  const cellCounts = candidateLines.map(({ line }) => countTableCells(line));
  const headerCellCount = cellCounts[0];

  if (headerCellCount < 2) return false;
  if (!cellCounts.every((count) => count === headerCellCount)) return false;
  if (isMarkdownSeparatorLine(candidateLines[1].line)) return false;

  return {
    hasPattern: true,
    headerIndex: candidateLines[0].index,
    headerCellCount,
  };
};

const isFencedCodeBlock = (block: string) => {
  const trimmed = block.trim();
  if (!trimmed) return false;

  const lines = trimmed.split("\n");
  if (lines.length < 2) return false;

  const firstLine = lines[0].trim();
  const lastLine = lines[lines.length - 1].trim();
  const fenceMatch = firstLine.match(/^(```+|~~~+)/);
  if (!fenceMatch) return false;

  const fence = fenceMatch[1];
  return lastLine.startsWith(fence);
};

const normalizeMarkdownTables = (content: string) => {
  if (!content.includes("|")) return content;

  const blocks = content.split(/\n\s*\n/);

  const normalizedBlocks = blocks.map((block) => {
    if (isFencedCodeBlock(block)) return block;

    const lines = block.split("\n");
    const tablePattern = hasClearTablePattern(lines);
    if (!tablePattern) return block;

    const { headerCellCount, headerIndex } = tablePattern;
    const separator = `|${Array(headerCellCount).fill(TABLE_SEPARATOR_CELL).join("|")}|`;

    return [
      ...lines.slice(0, headerIndex + 1),
      separator,
      ...lines.slice(headerIndex + 1),
    ].join("\n");
  });

  return normalizedBlocks.join("\n\n");
};

interface Props {
  message: AiMessage;
  conversationId?: string | null;
}

export function MessageBubble({ message, conversationId }: Props) {
  const isUser = message.role === "user";
  const contentRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<1 | -1 | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleCopy = async () => {
    const text = isUser
      ? message.content
      : (contentRef.current?.innerText ?? message.content);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleFeedback = async (rating: 1 | -1) => {
    if (feedback !== null || submitting || !conversationId) return;
    setSubmitting(true);
    setFeedback(rating); // optimistic — não permitimos desfazer
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return;
      await supabase.from("ai_message_feedback").insert({
        message_id: message.id,
        conversation_id: conversationId,
        user_id: uid,
        rating,
      });
    } catch {
      // falha silenciosa — feedback é opcional
    } finally {
      setSubmitting(false);
    }
  };

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
          "group relative rounded-2xl px-3 py-2 sm:px-4 sm:py-3 text-sm min-w-0 overflow-hidden",
          isUser
            ? "max-w-[calc(100%-2.75rem)] sm:max-w-[80%] md:max-w-[75%] bg-primary text-primary-foreground"
            : "max-w-[calc(100%-2.75rem)] sm:max-w-[85%] md:max-w-[80%] bg-muted text-foreground",
        )}
      >
        {!isUser && message.content && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleCopy}
                  aria-label={copied ? "Copiado" : "Copiar mensagem"}
                  className={cn(
                    "absolute top-1.5 right-1.5 h-7 w-7 inline-flex items-center justify-center rounded-md",
                    "bg-transparent text-muted-foreground hover:text-foreground hover:bg-background/60",
                    "opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity",
                  )}
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {copied ? "Copiado!" : "Copiar"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <div
            ref={contentRef}
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
                  <th
                    {...props}
                    className="px-2 py-1 text-left font-medium whitespace-normal break-words [&:has(code)]:whitespace-nowrap [&:has(code)]:font-mono [&:has(code)]:text-[11px] [&:has(code)]:tracking-tight"
                  />
                ),
                td: ({ node, ...props }) => (
                  <td
                    {...props}
                    className="px-2 py-1 align-top whitespace-normal break-words [&:has(code)]:whitespace-nowrap [&:has(code)]:font-mono [&:has(code)]:tabular-nums [&:has(code)]:text-[11px]"
                  />
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
              {normalizeMarkdownTables(message.content || "_(sem conteúdo)_")}
            </ReactMarkdown>
          </div>
        )}
        {message.status !== "ok" && (
          <p className="text-xs opacity-70 mt-1">
            {message.status === "aborted" ? "Resposta interrompida" : "Falha na resposta"}
          </p>
        )}
        {!isUser && message.content && message.status === "ok" && (
          <div
            className={cn(
              "mt-1.5 flex items-center justify-end gap-1",
              feedback === null
                ? "opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
                : "opacity-100",
            )}
          >
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => handleFeedback(1)}
                    disabled={feedback !== null || submitting}
                    aria-label="Resposta útil"
                    aria-pressed={feedback === 1}
                    className={cn(
                      "h-7 w-7 inline-flex items-center justify-center rounded-md transition-colors",
                      "hover:bg-background/60 disabled:cursor-default",
                      feedback === 1
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-muted-foreground hover:text-foreground",
                      feedback === -1 && "opacity-30",
                    )}
                  >
                    <ThumbsUp
                      className="h-3.5 w-3.5"
                      fill={feedback === 1 ? "currentColor" : "none"}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Resposta útil</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => handleFeedback(-1)}
                    disabled={feedback !== null || submitting}
                    aria-label="Resposta ruim"
                    aria-pressed={feedback === -1}
                    className={cn(
                      "h-7 w-7 inline-flex items-center justify-center rounded-md transition-colors",
                      "hover:bg-background/60 disabled:cursor-default",
                      feedback === -1
                        ? "text-red-600 dark:text-red-400"
                        : "text-muted-foreground hover:text-foreground",
                      feedback === 1 && "opacity-30",
                    )}
                  >
                    <ThumbsDown
                      className="h-3.5 w-3.5"
                      fill={feedback === -1 ? "currentColor" : "none"}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Resposta ruim</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
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
