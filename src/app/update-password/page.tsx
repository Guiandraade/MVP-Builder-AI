"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

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

export default function UpdatePasswordPage() {
  const router = useRouter();
  const { updatePassword } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const pwStrength = passwordStrength(password);
  const passwordTouched = password.length > 0;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (pwStrength < 4) { setError("Sua senha não atende todos os critérios de segurança."); return; }
    if (password !== confirmPassword) { setError("As senhas não coincidem."); return; }

    setSubmitting(true);
    try {
      await updatePassword(password);
      setDone(true);
      setTimeout(() => router.replace("/"), 2500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="flex min-h-dvh items-center justify-center px-6"
      style={{ background: "var(--background)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="brand-gradient flex h-12 w-12 select-none items-center justify-center rounded-2xl text-xl text-white shadow-lg">
            ✦
          </div>
          <div>
            <div className="text-xl font-semibold tracking-tight">MVP Builder AI</div>
            <div className="mt-1 text-sm" style={{ color: "hsl(240 5% 48%)" }}>
              Defina sua nova senha
            </div>
          </div>
        </div>

        <div
          className="rounded-2xl border p-6"
          style={{ background: "var(--surface-1)", borderColor: "hsl(240 10% 16%)" }}
        >
          {done ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl p-4 text-center text-sm"
              style={{
                background: "hsl(142 71% 45% / 0.1)",
                border: "1px solid hsl(142 71% 45% / 0.3)",
                color: "hsl(142 71% 60%)",
              }}
            >
              Senha redefinida com sucesso! Redirecionando...
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <p className="mb-4 text-sm" style={{ color: "hsl(240 5% 65%)" }}>
                  Escolha uma senha forte para sua conta.
                </p>
              </div>

              {/* Nova senha */}
              <div>
                <label className="mb-1.5 block text-xs font-medium" style={{ color: "hsl(240 5% 65%)" }}>
                  Nova senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Crie uma senha segura"
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

                {passwordTouched && (
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
                      <span
                        className="text-[11px] font-medium"
                        style={{ color: STRENGTH_COLORS[pwStrength] || "hsl(240 5% 40%)", minWidth: 48, textAlign: "right" }}
                      >
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

              {/* Confirmar senha */}
              <div>
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
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-xl px-3 py-2.5 text-xs"
                  style={{
                    background: "hsl(0 72% 51% / 0.1)",
                    border: "1px solid hsl(0 72% 51% / 0.25)",
                    color: "hsl(0 72% 65%)",
                  }}
                >
                  {error}
                </motion.p>
              )}

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
                    Salvando...
                  </>
                ) : (
                  "Salvar nova senha"
                )}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
