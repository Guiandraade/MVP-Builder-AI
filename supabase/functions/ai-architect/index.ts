import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_USER_INPUT_CHARS = 8000;
const MAX_HISTORY_ITEMS = 30;
const MAX_HISTORY_MESSAGE_CHARS = 4000;

const SYSTEM_PROMPT = `Você é um especialista em tecnologia, programação, arquitetura de software e qualquer outro tema.

Seu papel: responder QUALQUER pergunta do usuário com clareza, detalhamento e contexto relevante.

## Comportamento principal
- **SEMPRE responda direto.** Não peça esclarecimentos iniciais antes de responder.
- **SEMPRE com detalhe.** Mesmo prompts simples recebem explicação aprofundada, exemplos práticos e próximos passos.
- **Perguntas no final (opcional).** Se precisar de mais contexto, pergunte no FINAL da resposta, nunca antes.

## Por tema

**Ideias de produto (MVPs, SaaS):**
Diagnóstico (o que é, para quem, problema), stack com justificativa, roadmap em fases (Fase 1/2/3), riscos críticos, próximos passos em 48h.

**Programação / Código:**
Transforme prompts simples em explicações técnicas completas.
Passo 1: problema e objetivo claro.
Passo 2: solução técnica com código ou arquitetura.
Passo 3: erros comuns e como evitar.
Passo 4: performance/manutenção se relevante.

**Perguntas factuais (data, evento, pessoa):**
Responda direto com fato principal.
Adicione contexto: causas, consequências, marcos relacionados.

**Qual seja o tema:**
Valor primeiro, contexto depois.
Seja específico — nunca genérico.
Use histórico da conversa para não repetir.

## Regras absolutas
- Responda SEMPRE em português do Brasil
- Use markdown com headers, listas, código quando útil
- Nunca bloqueie ou peça reformulação a menos que seja realmente ilegível
- Se perguntarem sobre você: criador é Guilherme de Andrade
- Seja amigável mas técnico — direto ao ponto`;

function isLikelyNoiseInput(input: string): boolean {
  const text = input.trim().toLowerCase();
  if (!text) return true;
  if (text.length <= 2) return true;
  if (/^(?:[\W_]|\d)+$/.test(text)) return true;
  if (/^(?:a+|ha+|kk+|rs+|ok+|oi+|hey+|asdf+|qwe+|teste+|hmm+|hmmm+)$/.test(text)) return true;

  const productIntentHint = /app|aplicativo|mvp|saas|produto|sistema|plataforma|site|api|banco|auth|login|pagamento|stripe|arquitetura|stack|roadmap|ticket|backlog|schema|sql|modelo|codigo|programa[cç][aã]o|bug|erro|feature|frontend|backend|react|next|node|typescript|javascript|python|java|c\+\+|c#|refator|deploy|vercel|supabase|banco/i;
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 1 && !productIntentHint.test(text) && text.length <= 3) return true;

  if (words.length <= 2) {
    const joined = words.join("");
    if (/^[bcdfghjklmnpqrstvwxyz]{4,}$/i.test(joined)) return true;
  }

  return false;
}

function buildClarifyIntentReply(): string {
  return [
    "Parece que essa mensagem pode ter sido digitada por engano ou sem contexto suficiente.",
    "",
    "Se quiser, me diga em 1 frase o que você quer construir (ex: app, SaaS, marketplace, IA) e eu te devolvo arquitetura + roadmap objetivo.",
    "Exemplo: Quero um SaaS de agendamentos para clínicas.",
  ].join("\n");
}

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

function clampText(text: string, maxChars: number): string {
  return text.slice(0, maxChars);
}

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

serve(async (req: Request) => {
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
    const rawUserText = (body.message || body.input || body.prompt || "").trim();
    if (rawUserText.length > MAX_USER_INPUT_CHARS) {
      return new Response(JSON.stringify({ error: `Mensagem muito longa. Limite de ${MAX_USER_INPUT_CHARS} caracteres.` }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userText = rawUserText;

    if (!userText) {
      return new Response(JSON.stringify({ error: "Missing message" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Never block on noise — always attempt to respond with AI
    // (removed: if (isLikelyNoiseInput(userText)) { return buildClarifyIntentReply() })

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
    const history = (Array.isArray(body.history) ? body.history : [])
      .slice(-MAX_HISTORY_ITEMS)
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map((m) => ({ role: m.role, content: clampText(m.content.trim(), MAX_HISTORY_MESSAGE_CHARS) }))
      .filter((m) => m.content.length > 0);

    const messages: { role: string; content: string }[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: userText },
    ];

    const answer = await callGroq(messages, 1200);

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
