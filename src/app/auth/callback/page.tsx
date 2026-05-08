"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("Auth callback timeout")), ms);
    promise
      .then((value) => {
        clearTimeout(id);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(id);
        reject(error);
      });
  });
}

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const error = params.get("error");
        const errorDescription = params.get("error_description");

        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const hashError = hashParams.get("error");
        const hashErrorDescription = hashParams.get("error_description");

        const combinedError = error || hashError;
        const combinedDescription = errorDescription || hashErrorDescription;

        if (combinedError) {
          const message = encodeURIComponent(combinedDescription || combinedError);
          router.push(`/login?authError=${message}`);
          return;
        }

        if (code) {
          // Exchange code for session
          const { error: exchangeError } = await withTimeout(
            supabase.auth.exchangeCodeForSession(code),
            8000
          );
          if (exchangeError) {
            const message = encodeURIComponent(exchangeError.message);
            router.push(`/login?authError=${message}`);
            return;
          }
        }

        // Some providers can finish session without code in query.
        const {
          data: { session },
        } = await withTimeout(supabase.auth.getSession(), 5000);
        if (!session) {
          router.push("/login?authError=Não foi possível concluir o login social.");
          return;
        }

        // Redirect to chat
        router.push("/");
      } catch (error) {
        console.error("Callback error:", error);
        router.push("/login?authError=Falha ao concluir autenticação.");
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center space-y-4">
        <div className="inline-block animate-spin">⚙️</div>
        <p className="text-muted-foreground">Finalizando autenticação...</p>
      </div>
    </div>
  );
}
