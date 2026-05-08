"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, GitBranch, BarChart3, Eye, EyeOff, Check, X } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

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
    transition: { delay: 0.15 + i * 0.1, duration: 0.55, ease: "easeOut" as const },
  }),
};

type Rule = { label: string; test: (pw: string) => boolean };

const PASSWORD_RULES: Rule[] = [
  { label: "Mínimo 8 caracteres", test: (pw) => pw.length >= 8 },
  { label: "Uma letra maiúscula", test: (pw) => /[A-Z]/.test(pw) },
  { label: "Um número", test: (pw) => /[0-9]/.test(pw) },
  { label: "Um caractere especial (!@#$...)", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

function passwordStrength(pw: string): number {
  return PASSWORD_RULES.filter((r) => r.test(pw)).length;
}

const STRENGTH_LABELS = ["", "Fraca", "Razoável", "Boa", "Forte"];
const STRENGTH_COLORS = ["", "hsl(0 72% 51%)", "hsl(38 92% 50%)", "hsl(142 71% 45%)", "hsl(142 71% 45%)"];

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp, sendPasswordResetEmail, signInAsGuest, user, isGuest, loading } = useAuth();

  const getInitialError = () => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    const authErr = params.get("authError");
    return authErr ? decodeURIComponent(authErr) : "";
  };

  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(getInitialError);
  const [successMsg, setSuccessMsg] = useState("");

  const pwStrength = passwordStrength(password);
  const passwordTouched = password.length > 0;

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("authError")) {
      window.history.replaceState({}, "", "/login");
    }
  }, []);

  useEffect(() => {
    if (!loading && (user || isGuest)) router.replace("/");
  }, [user, isGuest, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="flex items-center gap-2 text-sm" style={{ color: "hsl(240 5% 45%)" }}>
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Carregando...
        </div>
      </div>
    );
  }

  if (user || isGuest) return null;

  const switchMode = (next: "login" | "signup" | "forgot") => {
    setMode(next);
    setError("");
    setSuccessMsg("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!email.trim()) { setError("Digite seu e-mail."); return; }

    if (mode === "forgot") {
      setSubmitting(true);
      try {
        await sendPasswordResetEmail(email.trim());
        setSuccessMsg("E-mail enviado! Verifique sua caixa de entrada e clique no link para redefinir sua senha.");
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!password) { setError("Digite sua senha."); return; }

    if (mode === "signup") {
      if (pwStrength < 4) { setError("Sua senha não atende todos os critérios de segurança."); return; }
      if (password !== confirmPassword) { setError("As senhas não coincidem."); return; }
    }

    setSubmitting(true);
    try {
      if (mode === "login") {
        await signIn(email.trim(), password);
      } else {
        const { needsConfirmation } = await signUp(email.trim(), password);
        if (needsConfirmation) {
          setSuccessMsg("Conta criada! Verifique seu e-mail para confirmar antes de entrar.");
          setPassword("");
          setConfirmPassword("");
        }
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: "var(--surface-2)",
    border: "1px solid hsl(240 10% 20%)",
    borderRadius: "0.75rem",
    color: "hsl(240 5% 90%)",
    fontSize: "0.9rem",
    padding: "0.7rem 0.9rem",
    width: "100%",
    outline: "none",
    transition: "border-color 0.15s",
  };

  return (
    <div className="flex min-h-dvh" style={{ background: "var(--background)" }}>

      {/* ── Left hero panel (desktop only) ────────────────────────────── */}
      <div
        className="relative hidden overflow-hidden lg:flex lg:w-[52%] lg:flex-col lg:justify-between lg:p-14"
        style={{ background: "var(--surface-1)", borderRight: "1px solid hsl(240 10% 13%)" }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 20% 15%, hsl(239 84% 67% / 0.18) 0%, transparent 55%), radial-gradient(ellipse at 85% 85%, hsl(192 91% 43% / 0.12) 0%, transparent 50%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(hsl(240 10% 22% / 0.35) 1px, transparent 1px), linear-gradient(90deg, hsl(240 10% 22% / 0.35) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />

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

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.08, ease: "easeOut" }}
          className="relative z-10"
        >
          <p className="mb-3 text-xs font-medium uppercase tracking-widest" style={{ color: "hsl(239 84% 70%)" }}>
            Arquitetura de Produto
          </p>
          <h1 className="mb-4 text-[2.4rem] font-bold leading-[1.15] tracking-tight">
            Construa seu{" "}
            <span
              className="brand-gradient"
              style={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
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
                  style={{ background: "hsl(239 84% 67% / 0.1)", border: "1px solid hsl(239 84% 67% / 0.18)" }}
                >
                  <f.Icon className="h-4 w-4" style={{ color: "hsl(239 84% 70%)" }} />
                </div>
                <div>
                  <div className="mb-0.5 text-sm font-medium" style={{ color: "hsl(240 5% 88%)" }}>{f.title}</div>
                  <div className="text-[0.8rem] leading-relaxed" style={{ color: "hsl(240 5% 48%)" }}>{f.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="relative z-10 text-[11px]"
          style={{ color: "hsl(240 5% 28%)" }}
        >
          Desenvolvido por Guilherme de Andrade
        </motion.p>
      </div>

      {/* ── Right login panel ──────────────────────────────────────────── */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-10 lg:w-[48%]">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="mb-8 flex flex-col items-center gap-3 text-center lg:hidden">
            <div className="brand-gradient flex h-12 w-12 select-none items-center justify-center rounded-2xl text-xl text-white shadow-lg">✦</div>
            <div>
              <div className="text-2xl font-semibold tracking-tight">MVP Builder AI</div>
              <div className="mt-1 text-sm" style={{ color: "hsl(240 5% 48%)" }}>Arquitete seu próximo produto com IA</div>
            </div>
          </div>

          {/* Desktop header */}
          <div className="mb-6 hidden lg:block">
            <h2 className="text-2xl font-semibold tracking-tight">
              {mode === "login" ? "Entrar na conta" : mode === "signup" ? "Criar conta" : "Redefinir senha"}
            </h2>
            <p className="mt-1.5 text-sm" style={{ color: "hsl(240 5% 48%)" }}>
              {mode === "login"
                ? "Bem-vindo de volta. Digite suas credenciais."
                : mode === "signup"
                ? "Crie sua conta para salvar seu histórico e projetos."
                : "Informe seu e-mail e enviaremos um link para redefinir."}
            </p>
          </div>

          {/* Tab switcher — hidden on forgot mode */}
          {mode !== "forgot" && (
            <div
              className="mb-5 flex rounded-xl p-1"
              style={{ background: "hsl(240 10% 10%)", border: "1px solid hsl(240 10% 16%)" }}
            >
              {(["login", "signup"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => switchMode(tab)}
                  className="flex-1 rounded-lg py-2 text-sm font-medium transition-all"
                  style={{
                    background: mode === tab ? "hsl(239 84% 67% / 0.18)" : "transparent",
                    color: mode === tab ? "hsl(239 84% 75%)" : "hsl(240 5% 50%)",
                    border: mode === tab ? "1px solid hsl(239 84% 67% / 0.3)" : "1px solid transparent",
                    cursor: "pointer",
                  }}
                >
                  {tab === "login" ? "Entrar" : "Criar conta"}
                </button>
              ))}
            </div>
          )}

          {/* Card */}
          <div
            className="rounded-2xl border p-6"
            style={{ background: "var(--surface-1)", borderColor: "hsl(240 10% 16%)" }}
          >
            <AnimatePresence mode="wait">
              {successMsg ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl p-4 text-sm text-center"
                  style={{ background: "hsl(142 71% 45% / 0.1)", border: "1px solid hsl(142 71% 45% / 0.3)", color: "hsl(142 71% 60%)" }}
                >
                  {successMsg}
                  <button
                    className="mt-3 block w-full text-xs underline"
                    style={{ color: "hsl(240 5% 55%)", background: "none", border: "none", cursor: "pointer" }}
                    onClick={() => { setSuccessMsg(""); switchMode("login"); }}
                  >
                    Ir para o login
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key={mode}
                  initial={{ opacity: 0, x: mode === "login" ? -12 : 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: mode === "login" ? 12 : -12 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleSubmit}
                  className="space-y-4"
                  noValidate
                >
                  {/* Forgot-password header inside card */}
                  {mode === "forgot" && (
                    <div>
                      <p className="text-sm font-medium" style={{ color: "hsl(240 5% 88%)" }}>Redefinir senha</p>
                      <p className="mt-1 text-xs" style={{ color: "hsl(240 5% 50%)" }}>Informe seu e-mail e enviaremos um link de redefinição.</p>
                    </div>
                  )}

                  {/* Email */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium" style={{ color: "hsl(240 5% 65%)" }}>
                      E-mail
                    </label>
                    <input
                      type="email"
                      autoComplete="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "hsl(239 84% 67% / 0.6)")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "hsl(240 10% 20%)")}
                    />
                  </div>

                  {/* Password — hidden on forgot mode */}
                  {mode !== "forgot" && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium" style={{ color: "hsl(240 5% 65%)" }}>
                      Senha
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        autoComplete={mode === "login" ? "current-password" : "new-password"}
                        placeholder={mode === "signup" ? "Crie uma senha segura" : "Sua senha"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ ...inputStyle, paddingRight: "2.5rem" }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "hsl(239 84% 67% / 0.6)")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "hsl(240 10% 20%)")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: "hsl(240 5% 45%)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                        tabIndex={-1}
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    {/* Password strength — only on signup */}
                    {mode === "signup" && passwordTouched && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-3 space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex flex-1 gap-1">
                            {[1, 2, 3, 4].map((n) => (
                              <div
                                key={n}
                                className="h-1 flex-1 rounded-full transition-all duration-300"
                                style={{ background: pwStrength >= n ? STRENGTH_COLORS[pwStrength] : "hsl(240 10% 20%)" }}
                              />
                            ))}
                          </div>
                          <span className="text-[11px] font-medium" style={{ color: STRENGTH_COLORS[pwStrength] || "hsl(240 5% 40%)", minWidth: 48, textAlign: "right" }}>
                            {STRENGTH_LABELS[pwStrength] || ""}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {PASSWORD_RULES.map((rule) => {
                            const ok = rule.test(password);
                            return (
                              <div key={rule.label} className="flex items-center gap-1.5">
                                {ok
                                  ? <Check size={11} style={{ color: "hsl(142 71% 45%)", flexShrink: 0 }} />
                                  : <X size={11} style={{ color: "hsl(240 5% 38%)", flexShrink: 0 }} />}
                                <span className="text-[11px]" style={{ color: ok ? "hsl(142 71% 55%)" : "hsl(240 5% 45%)" }}>
                                  {rule.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}

                    </div>
                    )}

                  {/* Confirm password — signup only */}
                  {mode === "signup" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <label className="mb-1.5 block text-xs font-medium" style={{ color: "hsl(240 5% 65%)" }}>
                        Confirmar senha
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirm ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="Repita a senha"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          style={{
                            ...inputStyle,
                            paddingRight: "2.5rem",
                            borderColor:
                              confirmPassword.length > 0
                                ? password === confirmPassword
                                  ? "hsl(142 71% 45% / 0.6)"
                                  : "hsl(0 72% 51% / 0.6)"
                                : "hsl(240 10% 20%)",
                          }}
                          onFocus={(e) => (e.currentTarget.style.borderColor = "hsl(239 84% 67% / 0.6)")}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor =
                              confirmPassword.length > 0
                                ? password === confirmPassword
                                  ? "hsl(142 71% 45% / 0.6)"
                                  : "hsl(0 72% 51% / 0.6)"
                                : "hsl(240 10% 20%)";
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                          style={{ color: "hsl(240 5% 45%)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                          tabIndex={-1}
                          aria-label={showConfirm ? "Ocultar senha" : "Mostrar senha"}
                        >
                          {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Error */}
                  {error && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="rounded-xl px-3 py-2.5 text-xs"
                      style={{ background: "hsl(0 72% 51% / 0.1)", border: "1px solid hsl(0 72% 51% / 0.25)", color: "hsl(0 72% 65%)" }}
                    >
                      {error}
                    </motion.p>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ background: "hsl(239 84% 67%)", color: "#fff" }}
                    onMouseEnter={(e) => { if (!submitting) (e.currentTarget as HTMLButtonElement).style.background = "hsl(239 84% 60%)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "hsl(239 84% 67%)"; }}
                  >
                    {submitting ? (
                      <>
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        {mode === "login" ? "Entrando..." : mode === "signup" ? "Criando conta..." : "Enviando..."}
                      </>
                    ) : (
                      mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Enviar link de redefinição"
                    )}
                  </button>

                  {/* Back to login — forgot mode */}
                  {mode === "forgot" && (
                    <button
                      type="button"
                      onClick={() => switchMode("login")}
                      className="w-full text-center text-xs"
                      style={{ color: "hsl(240 5% 45%)", background: "none", border: "none", cursor: "pointer" }}
                    >
                      ← Voltar para o login
                    </button>
                  )}
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Footer links */}
          <div className="mt-5 flex flex-col items-center gap-2 text-center">
            {mode === "login" && (
              <button
                onClick={() => switchMode("forgot")}
                className="text-xs transition-colors"
                style={{ color: "hsl(240 5% 38%)", background: "none", border: "none", cursor: "pointer" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "hsl(240 5% 60%)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "hsl(240 5% 38%)")}
              >
                Esqueci minha senha
              </button>
            )}
            <button
              onClick={signInAsGuest}
              className="text-sm transition-colors"
              style={{ color: "hsl(240 5% 42%)", background: "none", border: "none", cursor: "pointer" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "hsl(240 5% 65%)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "hsl(240 5% 42%)")}
            >
              Continuar sem conta
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
