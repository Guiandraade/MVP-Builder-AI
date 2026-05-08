"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Sparkles } from "lucide-react";

function GitHubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .322.216.694.825.576C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { signInWithGoogle, signInWithGithub, signInAsGuest, user, isGuest } = useAuth();

  const [socialLoading, setSocialLoading] = useState<"google" | "github" | null>(null);
  const [error, setError] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    const authErr = params.get("authError");
    if (!authErr) return "";
    const decoded = decodeURIComponent(authErr);
    if (/provider is not enabled|unsupported provider/i.test(decoded)) {
      return "Provedor nao habilitado. Configure em: Supabase > Authentication > Providers.";
    }
    return decoded;
  });

  useEffect(() => {
    if (window.location.search.includes("authError")) {
      window.history.replaceState({}, "", "/login");
    }
  }, []);

  useEffect(() => {
    if (user || isGuest) router.push("/");
  }, [user, isGuest, router]);

  if (user || isGuest) return null;

  const handleGoogle = async () => {
    setError("");
    setSocialLoading("google");
    try {
      await signInWithGoogle();
    } catch (err) {
      setError((err as Error).message || "Erro ao entrar com Google");
      setSocialLoading(null);
    }
  };

  const handleGithub = async () => {
    setError("");
    setSocialLoading("github");
    try {
      await signInWithGithub();
    } catch (err) {
      setError((err as Error).message || "Erro ao entrar com GitHub");
      setSocialLoading(null);
    }
  };

  const isLoading = !!socialLoading;

  return (
    <div
      className="relative flex min-h-dvh items-center justify-center overflow-hidden p-4"
      style={{
        background: "var(--background)",
        backgroundImage:
          "radial-gradient(ellipse at 30% 0%, hsl(239 84% 67% / 0.1), transparent 55%), radial-gradient(ellipse at 75% 100%, hsl(192 91% 43% / 0.07), transparent 55%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(hsl(240 10% 20% / 0.15) 1px, transparent 1px), linear-gradient(90deg, hsl(240 10% 20% / 0.15) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="brand-gradient flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <div>
            <div className="text-2xl font-semibold tracking-tight">MVP Builder AI</div>
            <div
              className="mt-0.5 text-[11px] uppercase tracking-[0.15em]"
              style={{ color: "hsl(239 84% 67%)" }}
            >
              Architect Mode
            </div>
          </div>
          <p className="mt-1 text-sm" style={{ color: "hsl(240 5% 50%)" }}>
            Transforme ideias em arquitetura tecnica executavel.
          </p>
        </div>

        <div
          className="rounded-2xl border p-6"
          style={{ background: "var(--surface-1)", borderColor: "hsl(240 10% 16%)" }}
        >
          <p className="mb-4 text-center text-xs font-medium uppercase tracking-widest" style={{ color: "hsl(240 5% 45%)" }}>
            Entrar com
          </p>

          <div className="space-y-3">
            <button
              onClick={handleGoogle}
              disabled={isLoading}
              className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border py-3 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                borderColor: "hsl(240 10% 20%)",
                background: "var(--surface-2)",
                color: "hsl(240 5% 85%)",
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "hsl(240 10% 30%)";
                  (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-3)";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "hsl(240 10% 20%)";
                (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-2)";
              }}
            >
              <GoogleIcon />
              {socialLoading === "google" ? "Redirecionando..." : "Continuar com Google"}
            </button>

            <button
              onClick={handleGithub}
              disabled={isLoading}
              className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border py-3 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                borderColor: "hsl(240 10% 20%)",
                background: "var(--surface-2)",
                color: "hsl(240 5% 85%)",
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "hsl(240 10% 30%)";
                  (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-3)";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "hsl(240 10% 20%)";
                (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-2)";
              }}
            >
              <GitHubIcon />
              {socialLoading === "github" ? "Redirecionando..." : "Continuar com GitHub"}
            </button>
          </div>

          {error && (
            <div
              className="mt-4 rounded-xl border p-3 text-xs"
              style={{
                borderColor: "hsl(0 72% 51% / 0.25)",
                background: "hsl(0 72% 51% / 0.07)",
                color: "hsl(0 72% 60%)",
              }}
            >
              {error}
            </div>
          )}

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: "hsl(240 10% 18%)" }} />
            <span className="text-[11px]" style={{ color: "hsl(240 5% 38%)" }}>ou</span>
            <div className="h-px flex-1" style={{ background: "hsl(240 10% 18%)" }} />
          </div>

          <button
            type="button"
            onClick={signInAsGuest}
            disabled={isLoading}
            className="w-full cursor-pointer rounded-xl border py-2.5 text-sm transition-all disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              borderColor: "hsl(240 10% 16%)",
              background: "transparent",
              color: "hsl(240 5% 45%)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "hsl(240 5% 65%)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "hsl(240 10% 24%)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "hsl(240 5% 45%)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "hsl(240 10% 16%)";
            }}
          >
            Explorar sem conta
          </button>
          <p className="mt-2 text-center text-[11px]" style={{ color: "hsl(240 5% 32%)" }}>
            Sem login, o historico nao e salvo.
          </p>
        </div>
      </div>
    </div>
  );
}
