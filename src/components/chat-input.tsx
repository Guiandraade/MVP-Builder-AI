"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";

interface ChatInputProps {
  disabled?: boolean;
  onSend: (message: string) => Promise<void>;
}

export function ChatInput({ disabled = false, onSend }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || disabled) return;

    const content = input.trim();
    setInput("");
    // Reset height
    if (textareaRef.current) textareaRef.current.style.height = "40px";

    setIsLoading(true);
    try {
      await onSend(content);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const canSend = input.trim().length > 0 && !isLoading && !disabled;

  return (
    <div
      className="border-t w-full"
      style={{
        borderColor: "hsl(240 10% 14%)",
        background: "var(--surface-1)",
      }}
    >
      <div
        className="mx-auto w-full max-w-3xl px-3 py-3 md:px-4 md:py-4"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-2 rounded-2xl border px-3 py-2"
          style={{
            background: "var(--surface-2)",
            borderColor: canSend ? "hsl(239 84% 67% / 0.35)" : "hsl(240 10% 18%)",
            transition: "border-color 0.2s",
          }}
        >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Descreva sua ideia de software..."
          disabled={isLoading || disabled}
          inputMode="text"
          className="flex-1 resize-none bg-transparent px-1 py-1 text-sm leading-relaxed outline-none placeholder:text-muted-foreground disabled:opacity-50"
          style={{ minHeight: "40px", maxHeight: "200px" }}
          rows={1}
        />
        <button
          type="submit"
          disabled={!canSend}
          className="brand-gradient flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-white shadow transition-opacity disabled:cursor-not-allowed disabled:opacity-30 md:h-10 md:w-10"
          style={{ minWidth: "36px" }}
          aria-label="Enviar mensagem"
        >
          <Send className="h-4 w-4" />
        </button>
        </form>
        <p
          className="mt-2 text-center text-[10px] hidden md:block"
          style={{ color: "hsl(240 5% 35%)" }}
        >
          Enter para enviar · Shift+Enter para nova linha
        </p>
      </div>
    </div>
  );
}

