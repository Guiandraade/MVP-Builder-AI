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
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateHeight = () => {
      const vv = window.visualViewport;
      if (!vv) {
        setViewportHeight(null);
        return;
      }

      if (window.matchMedia("(max-width: 767px)").matches) {
        setViewportHeight(Math.round(vv.height));
      } else {
        setViewportHeight(null);
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    window.visualViewport?.addEventListener("resize", updateHeight);
    window.visualViewport?.addEventListener("scroll", updateHeight);

    return () => {
      window.removeEventListener("resize", updateHeight);
      window.visualViewport?.removeEventListener("resize", updateHeight);
      window.visualViewport?.removeEventListener("scroll", updateHeight);
    };
  }, []);

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
    <div
      className="flex overflow-hidden"
      style={{
        background: "var(--background)",
        height: viewportHeight ? `${viewportHeight}px` : "100dvh",
      }}
    >
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

