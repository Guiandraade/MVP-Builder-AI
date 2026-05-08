"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

const GUEST_KEY = "mvp-builder-ai-guest";

function normalizeAuthError(error: unknown): string {
  if (!error || typeof error !== "object") return "Erro inesperado. Tente novamente.";
  const msg = "message" in error ? String((error as { message?: unknown }).message ?? "") : "";
  if (/invalid login credentials|invalid_credentials/i.test(msg)) return "E-mail ou senha incorretos.";
  if (/user already registered|already been registered/i.test(msg)) return "Este e-mail já está cadastrado. Faça login.";
  if (/email not confirmed/i.test(msg)) return "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.";
  if (/rate limit/i.test(msg)) return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  return msg || "Erro inesperado. Tente novamente.";
}

interface AuthContextType {
  user: User | null;
  isGuest: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>;
  signInAsGuest: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | undefined;

    const currentlyGuest = localStorage.getItem(GUEST_KEY) === "true";
    if (currentlyGuest) {
      setIsGuest(true);
      setLoading(false);
      return;
    }

    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          localStorage.removeItem(GUEST_KEY);
          setIsGuest(false);
        }
        setLoading(false);
      });
      subscription = data?.subscription;
    } catch (error) {
      console.error("Error setting up auth listener:", error);
      setLoading(false);
    }

    return () => subscription?.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(normalizeAuthError(error));
  };

  const signUp = async (email: string, password: string): Promise<{ needsConfirmation: boolean }> => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(normalizeAuthError(error));
    // If session is null after signup, email confirmation is required
    const needsConfirmation = !data.session;
    return { needsConfirmation };
  };

  const signInAsGuest = () => {
    localStorage.setItem(GUEST_KEY, "true");
    setIsGuest(true);
  };

  const signOut = async () => {
    localStorage.removeItem(GUEST_KEY);
    setIsGuest(false);
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, isGuest, loading, signIn, signUp, signInAsGuest, signOut }}>
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
