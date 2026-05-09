"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { useChatStore } from "@/lib/chat-store";
import { ChatMessage } from "@/components/chat-message";
import { ChatInput } from "@/components/chat-input";
import { MessageSkeleton } from "@/components/ui/skeleton";
import { generateAiResponse } from "@/lib/mock-ai";
import { generateTitle } from "@/lib/auto-title";
import { cn } from "@/lib/utils";
import { Pin, Menu } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface ChatAreaProps {
  className?: string;
  onMenuToggle?: () => void;
}

const STARTER_PROMPTS_POOL = [
  "Quero criar um SaaS de gestão para pequenas empresas",
  "Tenho uma ideia de app mobile e preciso de um MVP",
  "Como estruturar uma API escalável para meu produto?",
  "Qual stack escolher para um marketplace B2B?",
  "Quero construir uma plataforma de cursos online",
  "Como modelar o banco de dados para um multi-tenant SaaS?",
  "Meu app precisa de notificações em tempo real. Por onde começo?",
  "Qual a diferença prática entre monolito e microserviços para um MVP?",
  "Como implementar autenticação segura sem complicar o onboarding?",
  "Quero um sistema de pagamentos recorrentes. Qual a melhor abordagem?",
  "Como estruturar permissões e roles num produto B2B?",
  "Tenho um app com alto volume de uploads de arquivos. Como escalo?",
  "Como validar minha ideia de produto antes de escrever código?",
  "Qual a arquitetura ideal para um app de agendamentos com alta concorrência?",
  "Como construir um pipeline de dados para analytics no meu produto?",
];

function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

export function ChatArea({ className, onMenuToggle }: ChatAreaProps) {
  const { user, isGuest } = useAuth();
  const {
    currentConversation,
    messages,
    messagesLoading,
    addMessage,
    createConversation,
    setCurrentConversation,
    updateConversationTitle,
  } = useChatStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isReplying, setIsReplying] = useState(false);
  const [starterPrompts] = useState(() => pickRandom(STARTER_PROMPTS_POOL, 3));

  // Scroll to bottom whenever messages change or reply state changes
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, isReplying]);

  const handleSendMessage = async (content: string) => {
    if (!user && !isGuest) return;

    let conversation = currentConversation;
    let isFirstMessage = false;

    if (!conversation) {
      // Use first line as temp title; will be replaced by auto-title after AI responds
      const tempTitle = content.split("\n")[0].substring(0, 55) || "Novo chat";
      conversation = await createConversation(tempTitle);
      setCurrentConversation(conversation);
      isFirstMessage = true;
    } else {
      isFirstMessage = messages.filter((m) => !m.optimistic).length === 0;
    }

    // Optimistic user message (appears instantly)
    await addMessage(conversation.id, "user", content);

    // Snapshot history BEFORE the new user message for AI context
    const history = messages
      .filter((m) => !m.optimistic)
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    setIsReplying(true);
    try {
      const response = await generateAiResponse({
        userInput: content,
        conversationId: conversation.id,
        history,
      });
      await addMessage(conversation.id, "assistant", response);

      // Auto-title after first exchange
      if (isFirstMessage) {
        const token = user
          ? (await supabase.auth.getSession()).data.session?.access_token ?? ""
          : "";
        const title = await generateTitle(content, conversation.id, token);
        await updateConversationTitle(conversation.id, title);
      }
    } finally {
      setIsReplying(false);
    }
  };

  const isEmpty = !currentConversation;

  return (
    <div
      className={cn("flex flex-1 flex-col overflow-hidden", className)}
      style={{ background: "var(--background)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between border-b px-4 py-3 md:px-6"
        style={{ borderColor: "hsl(240 10% 16%)", background: "var(--surface-1)" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors md:hidden"
            style={{ color: "hsl(240 5% 55%)" }}
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <div
              className="text-[10px] uppercase tracking-[0.14em]"
              style={{ color: "hsl(240 5% 45%)" }}
            >
              MVP Builder AI
            </div>
            <h1 className="text-sm font-semibold truncate max-w-[200px] md:max-w-none md:text-base">
              {currentConversation?.title ?? "Arquiteto de Software"}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {currentConversation && (
            <span
              className="hidden items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-wider md:inline-flex"
              style={{
                borderColor: "hsl(239 84% 67% / 0.15)",
                color: "hsl(239 84% 67%)",
                background: "hsl(239 84% 67% / 0.06)",
              }}
            >
              <Pin className="h-2.5 w-2.5" />
              Conversa ativa
            </span>
          )}

        </div>
      </div>

      {/* Body */}
      <AnimatePresence mode="wait">
        {isEmpty ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-1 items-center justify-center p-6"
          >
            <div className="w-full max-w-xl">
              <div className="mb-10 text-center">
                <div
                  className="mx-auto mb-5 h-10 w-10 rounded-2xl flex items-center justify-center text-lg select-none"
                  style={{ background: "hsl(239 84% 67% / 0.12)", border: "1px solid hsl(239 84% 67% / 0.2)", color: "hsl(239 84% 67%)" }}
                >
                  ✦
                </div>
                <h2 className="text-2xl font-semibold tracking-tight">O que você está construindo?</h2>
                <p className="mt-2 text-sm" style={{ color: "hsl(240 5% 50%)" }}>
                  Descreva sua ideia — receba arquitetura, stack e roadmap sob medida.
                </p>
                <p className="mt-2 text-xs" style={{ color: "hsl(240 5% 42%)" }}>
                  Criada por Guilherme de Andrade, esta IA está à sua disposição para ajudar.
                </p>
              </div>

              <div className="space-y-2">
                {starterPrompts.map((prompt, i) => (
                  <button
                    key={prompt}
                    onClick={() => handleSendMessage(prompt)}
                    className="group flex w-full cursor-pointer items-start gap-3 rounded-xl border px-4 py-3.5 text-left text-sm transition-all"
                    style={{
                      borderColor: "hsl(240 10% 16%)",
                      background: "var(--surface-1)",
                      color: "hsl(240 5% 72%)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "hsl(239 84% 67% / 0.3)";
                      (e.currentTarget as HTMLButtonElement).style.background = "hsl(239 84% 67% / 0.04)";
                      (e.currentTarget as HTMLButtonElement).style.color = "hsl(240 5% 92%)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "hsl(240 10% 16%)";
                      (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-1)";
                      (e.currentTarget as HTMLButtonElement).style.color = "hsl(240 5% 72%)";
                    }}
                  >
                    <span
                      className="mt-0.5 shrink-0 text-[10px] font-mono tabular-nums"
                      style={{ color: "hsl(239 84% 67% / 0.5)" }}
                    >
                      0{i + 1}
                    </span>
                    <span className="flex-1">{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={currentConversation.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <div ref={scrollRef} className="chat-scroll flex-1">
              <div className="mx-auto w-full max-w-3xl space-y-1 py-4">
                {messagesLoading ? (
                  <>
                    <MessageSkeleton />
                    <MessageSkeleton />
                    <MessageSkeleton />
                  </>
                ) : (
                  <>
                    {messages.map((message) => (
                      <ChatMessage key={message.id} message={message} />
                    ))}
                    {isReplying && (
                      <div className="flex items-start gap-3 px-4 py-3 md:px-6">
                        <div
                          className="mt-0.5 h-6 w-6 shrink-0 rounded-full flex items-center justify-center text-[11px] font-semibold select-none"
                          style={{ background: "hsl(239 84% 67% / 0.12)", color: "hsl(239 84% 67%)", border: "1px solid hsl(239 84% 67% / 0.2)" }}
                        >
                          ✦
                        </div>
                        <div className="flex items-center gap-1.5 pt-1.5">
                          {[0, 0.15, 0.3].map((delay) => (
                            <motion.span
                              key={delay}
                              className="block h-2 w-2 rounded-full"
                              style={{ background: "hsl(239 84% 67%)" }}
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1.2, repeat: Infinity, delay }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {/* bottom anchor */}
                    <div className="h-4" />
                  </>
                )}
              </div>
            </div>
            <ChatInput onSend={handleSendMessage} disabled={isReplying} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

