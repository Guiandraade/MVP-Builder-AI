import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `Você é o Arquiteto AI — um especialista sênior em construção de MVPs, produtos SaaS e arquitetura de software.

Seu papel é transformar qualquer ideia — mesmo vaga — em uma estratégia clara, técnica e executável.

## Como você responde

**Quando o usuário descrever uma ideia de produto (mesmo com 1 frase):**
Extraia o máximo de contexto implícito e entregue imediatamente:
1. **Diagnóstico da ideia** — o que é, para quem, qual problema resolve
2. **Stack recomendado** — com justificativa técnica (ex: Next.js + Supabase + Vercel)
3. **Roadmap em fases** — Fase 1 (core), Fase 2 (valor), Fase 3 (escala) com entregas específicas
4. **Riscos críticos** — 2-3 pontos de atenção técnica ou de negócio
5. **Próximo passo concreto** — o que fazer nas próximas 48h

**Quando o usuário pedir backlog, tickets ou tarefas:**
Gere um backlog priorizado em sprints com tarefas técnicas específicas e acionáveis.

**Quando o usuário pedir modelo de dados ou schema:**
Gere o SQL completo com tabelas, RLS e comentários.

**Quando o usuário pedir sobre monetização:**
Sugira estrutura de planos, preços em BRL, implementação com Stripe e armadilhas comuns.

**Quando o usuário pedir comparação de tecnologias:**
Compare prós, contras, custo e velocidade de desenvolvimento para o contexto dele.

**Quando a mensagem for curta ou vaga (ex: "quero fazer um app de finanças"):**
NÃO peça mais informações. Assuma o contexto mais provável, entregue a estratégia completa e ao final pergunte se quer ajustar algum aspecto.

## Regras absolutas
- Responda SEMPRE em português do Brasil
- Use markdown com headers, listas e blocos de código quando útil
- Nunca dê respostas genéricas — seja específico para o contexto da conversa
- Leve em conta TODO o histórico da conversa para não repetir ou contradizer
- Seja direto: entregue valor primeiro, contexto depois`;

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type RequestBody = {
  message?: string;
  input?: string;
  prompt?: string;
  mode?: "chat" | "title";
  history?: ChatMessage[];
};

function fallbackTitle(userText: string): string {
  const base = userText.split(/[.!?\n]/)[0].trim().replace(/^[#\-*>\s]+/, "");
  const clipped = (base || "Novo chat").slice(0, 55);
  return clipped.charAt(0).toUpperCase() + clipped.slice(1);
}

async function callGroq(messages: { role: string; content: string }[], maxTokens = 1024): Promise<string> {
  const apiKey = Deno.env.get("GROQ_API_KEY");
  if (!apiKey) {
    throw new Error("GROQ_API_KEY não configurada na Edge Function");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0.6,
      max_tokens: maxTokens,
      messages,
    }),
  });

  if (!response.ok) {
    const raw = await response.text();
    throw new Error(`Groq error ${response.status}: ${raw}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("Resposta inválida do Groq");
  }

  return content.trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as RequestBody;
    const userText = (body.message || body.input || body.prompt || "").trim();

    if (!userText) {
      return new Response(JSON.stringify({ error: "Missing message" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mode = body.mode === "title" ? "title" : "chat";

    if (mode === "title") {
      let title: string;
      try {
        title = await callGroq([
          { role: "system", content: "Gere um título curto para uma conversa sobre produto/startup. Regras: 3 a 6 palavras, português, sem aspas, sem ponto final. Retorne APENAS o título, nada mais." },
          { role: "user", content: userText },
        ], 30);
        const sanitized = title.replace(/[\n\r]/g, " ").replace(/[\"']/g, "").trim().slice(0, 60);
        return new Response(JSON.stringify({ title: sanitized }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        const sanitized = fallbackTitle(userText);
        return new Response(JSON.stringify({ title: sanitized }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Build messages with history
    const history = Array.isArray(body.history) ? body.history : [];
    const messages: { role: string; content: string }[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: userText },
    ];

    const answer = await callGroq(messages, 1500);

    return new Response(JSON.stringify({ answer }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unexpected error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
