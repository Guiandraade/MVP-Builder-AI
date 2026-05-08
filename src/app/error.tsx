"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-6 p-8 text-center"
      style={{ background: "var(--background)" }}
    >
      <div style={{ color: "hsl(240 5% 65%)" }}>
        <p className="text-lg font-medium" style={{ color: "hsl(240 5% 85%)" }}>
          Algo deu errado
        </p>
        {process.env.NODE_ENV !== "production" && (
          <p className="mt-2 font-mono text-xs" style={{ color: "hsl(0 70% 65%)" }}>
            {error.message}
          </p>
        )}
      </div>
      <button
        onClick={reset}
        className="rounded-xl px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-80"
        style={{ background: "hsl(239 84% 67%)", color: "white" }}
      >
        Tentar novamente
      </button>
    </div>
  );
}
