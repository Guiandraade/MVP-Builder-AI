"use client";

import { motion } from "framer-motion";
import { Message } from "@/lib/chat-store";
import { MessageContent } from "@/components/message-content";

interface ChatMessageProps {
  message: Message;
}


export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex w-full gap-3 px-4 py-2 md:px-6 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {!isUser && (
        <div
          className="brand-gradient mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold text-white shadow-md"
          aria-label="AI"
        >
          AI
        </div>
      )}

      <div
        className={isUser
          ? "max-w-[85%] sm:max-w-[72%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm leading-relaxed shadow-sm"
          : "min-w-0 flex-1"
        }
        style={
          isUser
            ? {
                background: "linear-gradient(135deg, hsl(239 84% 67% / 0.85), hsl(239 84% 57% / 0.9))",
                color: "white",
                border: "1px solid hsl(239 84% 67% / 0.3)",
              }
            : undefined
        }
      >
        {isUser ? (
          <>
            <div
              className="mb-1 text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: "hsl(0 0% 100% / 0.55)" }}
            >
              Você
            </div>
            <div className="whitespace-pre-wrap break-words">
              {message.content}
            </div>
          </>
        ) : (
          <>
            <div
              className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: "hsl(239 84% 67%)" }}
            >
              Arquiteto AI
            </div>
            <MessageContent content={message.content} />
          </>
        )}
        {message.optimistic && (
          <div
            className="mt-1.5 flex items-center gap-1 text-[10px]"
            style={{ color: isUser ? "hsl(0 0% 100% / 0.5)" : "hsl(240 5% 55%)" }}
          >
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
            Enviando...
          </div>
        )}
      </div>

      {isUser && (
        <div
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold"
          style={{ background: "var(--surface-3)", color: "hsl(240 5% 70%)" }}
          aria-label="Você"
        >
          EU
        </div>
      )}
    </motion.div>
  );
}

