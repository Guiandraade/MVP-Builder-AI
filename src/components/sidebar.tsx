"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { useChatStore } from "@/lib/chat-store";
import { ConversationList } from "@/components/conversation-list";
import { Plus, LogOut, Search, X } from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function SidebarContent({
  onMobileClose,
  isMobile = false,
}: {
  onMobileClose?: () => void;
  isMobile?: boolean;
}) {
  const { signOut, user, isGuest } = useAuth();
  const {
    conversations,
    currentConversation,
    createConversation,
    setCurrentConversation,
    searchQuery,
    setSearchQuery,
  } = useChatStore();

  const [creating, setCreating] = useState(false);

  const handleNewChat = async () => {
    setCreating(true);
    try {
      const conv = await createConversation("Novo chat");
      setCurrentConversation(conv);
      onMobileClose?.();
    } catch (error) {
      console.error("Error creating conversation:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleSelect = (conv: Parameters<typeof setCurrentConversation>[0]) => {
    setCurrentConversation(conv);
    onMobileClose?.();
  };

  const filteredConversations = searchQuery.trim()
    ? conversations.filter((c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  const userInitial = isGuest ? "V" : (user?.email?.charAt(0).toUpperCase() ?? "U");

  return (
    <div
      className="flex h-full w-64 flex-col border-r"
      style={{
        background: "var(--surface-1)",
        borderColor: "hsl(240 10% 14%)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between border-b p-4"
        style={{ borderColor: "hsl(240 10% 14%)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-semibold shadow"
            style={{
              background: "hsl(220 8% 20%)",
              color: "hsl(0 0% 92%)",
              border: "1px solid hsl(0 0% 100% / 0.14)",
            }}
          >
            MB
          </div>
          <div>
            <div className="text-sm font-semibold leading-none">MVP Builder AI</div>
            <div
              className="text-[10px] uppercase tracking-[0.1em] mt-0.5"
              style={{ color: "hsl(0 0% 68%)" }}
            >
              Architect Mode
            </div>
          </div>
        </div>
        {isMobile && onMobileClose && (
          <button
            onClick={onMobileClose}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg"
            style={{ color: "hsl(240 5% 55%)" }}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* New chat */}
      <div className="p-3">
        <button
          onClick={handleNewChat}
          disabled={creating}
          className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            background: "hsl(220 8% 20%)",
            color: "hsl(0 0% 92%)",
            border: "1px solid hsl(0 0% 100% / 0.12)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "hsl(220 8% 24%)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "hsl(220 8% 20%)";
          }}
        >
          <Plus className="h-4 w-4" />
          Novo Chat
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div
          className="flex items-center gap-2 rounded-xl border px-3 py-2"
          style={{
            borderColor: "hsl(240 10% 18%)",
            background: "var(--surface-2)",
          }}
        >
          <Search className="h-3.5 w-3.5 shrink-0" style={{ color: "hsl(240 5% 45%)" }} />
          <input
            type="text"
            placeholder="Buscar conversas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            style={{ fontSize: "0.8rem" }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} style={{ color: "hsl(240 5% 45%)" }} className="cursor-pointer">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Conversation list */}
      <ConversationList
        conversations={filteredConversations}
        currentConversation={currentConversation}
        onSelect={handleSelect}
      />

      {/* Footer */}
      <div
        className="flex items-center gap-2 border-t p-3"
        style={{ borderColor: "hsl(240 10% 14%)" }}
      >
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
          style={{ background: "var(--surface-3)", color: "hsl(240 5% 70%)" }}
        >
          {userInitial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs" style={{ color: "hsl(240 5% 55%)" }}>
            {isGuest ? "Visitante — sem login" : user?.email}
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg transition-colors"
          style={{ color: "hsl(240 5% 45%)" }}
          title="Sair"
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "hsl(0 72% 60%)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "hsl(240 5% 45%)";
          }}
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar — always visible on md+ */}
      <div className="hidden md:flex">
        <SidebarContent />
      </div>

      {/* Mobile drawer — only mounts when mobileOpen=true */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 md:hidden"
              style={{ background: "hsl(240 20% 6% / 0.7)", backdropFilter: "blur(4px)" }}
              onClick={onMobileClose}
            />
            <motion.div
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 left-0 z-50 md:hidden"
            >
              <SidebarContent isMobile onMobileClose={onMobileClose} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
