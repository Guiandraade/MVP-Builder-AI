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
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={`flex w-full gap-3 px-4 py-3 md:px-6 ${
        isUser ? "justify-end" : "justify-start items-start"
      }`}
    >
      {!isUser && (
        <div
          className="mt-0.5 h-6 w-6 shrink-0 rounded-full flex items-center justify-center text-[11px] font-semibold select-none"
          style={{
            background: "hsl(0 0% 100% / 0.05)",
            color: "hsl(0 0% 84%)",
            border: "1px solid hsl(0 0% 100% / 0.14)",
          }}
          aria-label="Arquiteto AI"
        >
          A
        </div>
      )}

      <div
        className={
          isUser
            ? "max-w-[80%] sm:max-w-[68%] rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed"
            : "min-w-0 flex-1 text-sm leading-relaxed"
        }
        style={
          isUser
            ? {
                background: "hsl(240 14% 17%)",
                color: "hsl(240 5% 92%)",
                border: "1px solid hsl(240 10% 23%)",
              }
            : undefined
        }
      >
        {isUser ? (
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        ) : (
          <MessageContent content={message.content} />
        )}
        {message.optimistic && (
          <div
            className="mt-2 flex items-center gap-1 text-[10px]"
            style={{ color: isUser ? "hsl(240 5% 55%)" : "hsl(240 5% 45%)" }}
          >
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
            Enviando…
          </div>
        )}
      </div>
    </motion.div>
  );
}
