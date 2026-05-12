import { useRef, useEffect, KeyboardEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  isSending: boolean;
}

export function ChatInput({ value, onChange, onSend, isSending }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [value]);

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // No mobile, Enter quebra linha; só envia com Ctrl/Cmd+Enter ou Shift+Enter mantém quebra
    // Em desktop, Enter envia, Shift+Enter quebra
    const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
    if (e.key === "Enter" && !e.shiftKey && !isMobile) {
      e.preventDefault();
      if (!isSending && value.trim()) onSend();
    }
  };

  return (
    <div
      className="flex items-end gap-2 px-4 py-3 border-t border-border bg-card"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <Textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Pergunte sobre estoque, vendas, redistribuição entre PDVs…"
        rows={1}
        className="resize-none min-h-[44px] max-h-40 flex-1 text-base sm:text-[14px] bg-background border border-border rounded-[8px] px-3.5 py-2 focus-visible:border-primary focus-visible:ring-0 focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]"
        disabled={isSending}
      />
      <Button
        type="button"
        size="icon"
        className="h-9 w-9 flex-shrink-0 self-end bg-primary text-white rounded-[8px] hover:bg-primary/90 disabled:opacity-50"
        onClick={onSend}
        disabled={isSending || !value.trim()}
        aria-label="Enviar mensagem"
      >
        {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      </Button>
    </div>
  );
}
