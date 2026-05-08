"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Zap, GitBranch, BarChart3 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .322.216.694.825.576C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

const FEATURES = [
  {
    Icon: Zap,
    title: "Stack ideal para o seu contexto",
    desc: "Recomendações personalizadas baseadas no seu produto — não templates genéricos.",
  },
  {
    Icon: GitBranch,
    title: "Roadmap em fases realistas",
    desc: "Backlog priorizado, modelo de dados e arquitetura sem over-engineering.",
  },
  {
    Icon: BarChart3,
    title: "Decisões com trade-offs claros",
    desc: "Saiba o que escalar, o que simplificar e quando — com base em evidências.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.1, duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function LoginPage() {
  const router = useRouter();
  const { signInWithGoogle, signInWithGithub, signInAsGuest, user, isGuest } = useAuth();
  const [socialLoading, setSocialLoading] = useState<"google" | "github" | null>(null);

  const getInitialError = () => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    const authErr = params.get("authError");
    if (!authErr) return "";
    const decoded = decodeURIComponent(authErr);
    return /provider is not enabled|unsupported provider/i.test(decoded)
      ? "Provedor não habilitado. Configure em: Supabase > Authentication > Providers."
      : decoded;
  };

  const [error, setError] = useState(getInitialError);

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
    <div className="flex min-h-dvh" style={{ background: "var(--background)" }}>

      {/* ── Left hero panel (desktop only) ────────────────────────────── */}
      <div
        className="relative hidden overflow-hidden lg:flex lg:w-[52%] lg:flex-col lg:justify-between lg:p-14"
        style={{
          background: "var(--surface-1)",
          borderRight: "1px solid hsl(240 10% 13%)",
        }}
      >
        {/* Ambient glows */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 20% 15%, hsl(239 84% 67% / 0.18) 0%, transparent 55%), radial-gradient(ellipse at 85% 85%, hsl(192 91% 43% / 0.12) 0%, transparent 50%)",
          }}
        />
        {/* Subtle grid */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(hsl(240 10% 22% / 0.35) 1px, transparent 1px), linear-gradient(90deg, hsl(240 10% 22% / 0.35) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />

        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex items-center gap-3"
        >
          <div className="brand-gradient flex h-9 w-9 select-none items-center justify-center rounded-xl text-lg text-white shadow-lg">
            ✦
          </div>
          <span className="text-sm font-semibold tracking-tight">MVP Builder AI</span>
        </motion.div>

        {/* Headline + features */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10"
        >
          <p className="mb-3 text-xs font-medium uppercase tracking-widest" style={{ color: "hsl(239 84% 70%)" }}>
            Arquitetura de Produto
          </p>
          <h1 className="mb-4 text-[2.4rem] font-bold leading-[1.15] tracking-tight">
            Construa seu{" "}
            <span
              className="brand-gradient"
              style={{
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              próximo produto
            </span>
            {" "}com IA
          </h1>
          <p className="mb-12 max-w-xs text-[0.95rem] leading-relaxed" style={{ color: "hsl(240 5% 52%)" }}>
            Do briefing ao MVP em semanas. Stack, arquitetura e roadmap gerados a partir do contexto real do seu produto.
          </p>

          <div className="space-y-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                initial="hidden"
                animate="show"
                variants={fadeUp}
                className="flex items-start gap-4"
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    background: "hsl(239 84% 67% / 0.1)",
                    border: "1px solid hsl(239 84% 67% / 0.18)",
                  }}
                >
                  <f.Icon className="h-4 w-4" style={{ color: "hsl(239 84% 70%)" }} />
                </div>
                <div>
                  <div className="mb-0.5 text-sm font-medium" style={{ color: "hsl(240 5% 88%)" }}>
                    {f.title}
                  </div>
                  <div className="text-[0.8rem] leading-relaxed" style={{ color: "hsl(240 5% 48%)" }}>
                    {f.desc}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="relative z-10 text-[11px]"
          style={{ color: "hsl(240 5% 28%)" }}
        >
          Powered by Groq · Llama 3.3 70B
        </motion.p>
      </div>

      {/* ── Right login panel ──────────────────────────────────────────── */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-10 lg:w-[48%]">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo — hidden on desktop */}
          <div className="mb-8 flex flex-col items-center gap-3 text-center lg:hidden">
            <div className="brand-gradient flex h-12 w-12 select-none items-center justify-center rounded-2xl text-xl text-white shadow-lg">
              ✦
            </div>
            <div>
              <div className="text-2xl font-semibold tracking-tight">MVP Builder AI</div>
              <div className="mt-1 text-sm" style={{ color: "hsl(240 5% 48%)" }}>
                Arquitete seu próximo produto com IA
              </div>
            </div>
          </div>

          {/* Desktop welcome header — hidden on mobile */}
          <div className="mb-8 hidden lg:block">
            <h2 className="text-2xl font-semibold tracking-tight">Bem-vindo</h2>
            <p className="mt-1.5 text-sm" style={{ color: "hsl(240 5% 48%)" }}>
              Entre para salvar seu histórico e projetos.
            </p>
          </div>

          {/* Card */}
          <div
            className="rounded-2xl border p-6"
            style={{ background: "var(--surface-1)", borderColor: "hsl(240 10% 16%)" }}
          >
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
              Sem login, o histórico não é salvo.
            </p>
          </div>

          <p className="mt-6 text-center text-[11px]" style={{ color: "hsl(240 5% 28%)" }}>
            Ao entrar, você concorda com os termos de uso.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
