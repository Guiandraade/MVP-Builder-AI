"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Sidebar } from "@/components/sidebar";
import { ChatArea } from "@/components/chat-area";
import { useChatStore } from "@/lib/chat-store";

export default function ChatPage() {
  const router = useRouter();
  const { user, isGuest, loading } = useAuth();
  const { fetchConversations, setGuestMode } = useChatStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setGuestMode(isGuest);
  }, [isGuest, setGuestMode]);

  useEffect(() => {
    if (!loading && !user && !isGuest) {
      router.replace("/login");
    }
  }, [user, isGuest, loading, router]);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  return (
    <div className="flex h-dvh overflow-hidden" style={{ background: "var(--background)" }}>
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex items-center gap-2 text-sm" style={{ color: "hsl(240 5% 45%)" }}>
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Carregando...
          </div>
        </div>
      ) : user || isGuest ? (
        <>
          <Sidebar
            mobileOpen={mobileMenuOpen}
            onMobileClose={() => setMobileMenuOpen(false)}
          />
          <ChatArea
            className="flex-1"
            onMenuToggle={() => setMobileMenuOpen(true)}
          />
        </>
      ) : null}
    </div>
  );
}

