"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

const GUEST_KEY = "mvp-builder-ai-guest";

function normalizeAuthErrorMessage(error: unknown): string {
  const fallback = "Não foi possível autenticar agora. Tente novamente.";

  if (!error || typeof error !== "object") return fallback;
  const raw = "message" in error ? String((error as { message?: unknown }).message ?? "") : "";
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as { error_description?: string; msg?: string; code?: string };
    const msg = parsed.error_description || parsed.msg || raw;

    if (/provider is not enabled/i.test(msg)) {
      return "Login social ainda não está habilitado no Supabase para este provedor.";
    }
    if (/invalid redirect url|redirect_uri/i.test(msg)) {
      return "URL de redirecionamento inválida. Verifique Auth > URL Configuration no Supabase.";
    }
    return msg;
  } catch {
    if (/provider is not enabled/i.test(raw)) {
      return "Login social ainda não está habilitado no Supabase para este provedor.";
    }
    if (/invalid redirect url|redirect_uri/i.test(raw)) {
      return "URL de redirecionamento inválida. Verifique Auth > URL Configuration no Supabase.";
    }
    return raw;
  }
}

interface AuthContextType {
  user: User | null;
  isGuest: boolean;
  loading: boolean;
  signInWithMagicLink: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signInAsGuest: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // Safe SSR defaults — always match server render to avoid hydration mismatch.
  // Real values are read from localStorage in useEffect (client-only).
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | undefined;

    // Guest mode — skip Supabase entirely
    const currentlyGuest = localStorage.getItem(GUEST_KEY) === "true";
    if (currentlyGuest) {
      setIsGuest(true);
      setLoading(false);
      return;
    }

    // Use onAuthStateChange as sole source of truth.
    // It fires INITIAL_SESSION on setup, then for every subsequent change.
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);

        if (session?.user) {
          localStorage.removeItem(GUEST_KEY);
          setIsGuest(false);
        }

        // Always mark loading done — whether session exists or not
        setLoading(false);
      });
      subscription = data?.subscription;
    } catch (error) {
      console.error("Error setting up auth listener:", error);
      setLoading(false);
    }

    return () => subscription?.unsubscribe();
  }, []);

  const signInAsGuest = () => {
    localStorage.setItem(GUEST_KEY, "true");
    setIsGuest(true);
  };

  const signInWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    if (process.env.NEXT_PUBLIC_SOCIAL_AUTH_ENABLED !== "true") {
      throw new Error("Login com Google está temporariamente desativado.");
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: true,
      },
    });
    if (error) throw new Error(normalizeAuthErrorMessage(error));
    if (data?.url) {
      window.location.assign(data.url);
      return;
    }
    throw new Error("Não foi possível iniciar o login com Google.");
  };

  const signInWithGithub = async () => {
    if (process.env.NEXT_PUBLIC_SOCIAL_AUTH_ENABLED !== "true") {
      throw new Error("Login com GitHub está temporariamente desativado.");
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: true,
      },
    });
    if (error) throw new Error(normalizeAuthErrorMessage(error));
    if (data?.url) {
      window.location.assign(data.url);
      return;
    }
    throw new Error("Não foi possível iniciar o login com GitHub.");
  };

  const signOut = async () => {
    localStorage.removeItem(GUEST_KEY);
    setIsGuest(false);
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, isGuest, loading, signInWithMagicLink, signInWithGoogle, signInWithGithub, signInAsGuest, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
