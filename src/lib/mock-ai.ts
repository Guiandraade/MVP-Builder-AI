import { supabase } from "@/lib/supabase/client";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type GenerateAiResponseInput = {
  userInput: string;
  conversationId?: string;
  history?: ChatMessage[];
};

type GenerateAiResponseOutput = Record<string, unknown>;
let hasWarnedEdgeUnavailable = false;
const aiMode = (process.env.NEXT_PUBLIC_AI_MODE ?? "local").toLowerCase();
const isLocalMode = aiMode !== "remote";

export function buildServiceUnavailableMessage(): string {
  return [
    "O chat está indisponível neste momento.",
    "Tente novamente em alguns minutos.",
    "Se o problema continuar, verifique a disponibilidade da IA remota (Groq/Supabase).",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// LOCAL CONVERSATIONAL ENGINE
// ---------------------------------------------------------------------------

const CLARIFYING_QUESTIONS = [
  [
    "Quem e o usuario principal desse produto? (ex: empresas, consumidores, desenvolvedores)",
    "Ja existe alguma solucao parecida no mercado? Qual e o diferencial que voce enxerga?",
    "Qual e o seu prazo realista para ter um MVP funcionando?",
  ],
  [
    "Voce ja tem usuarios ou clientes em mente para testar? Como pretende validar?",
    "Quais sao as 2 ou 3 funcionalidades que sao absolutamente inegociaveis para o lancamento?",
    "Voce tem preferencia de tecnologia ou quer que eu indique o stack mais adequado?",
  ],
  [
    "Como voce imagina a monetizacao? (assinatura, uso, licenca, freemium...)",
    "Vai ter alguma integracao critica com sistemas externos? (pagamentos, email, APIs de terceiros)",
    "Qual e o maior risco tecnico ou de negocio que te preocupa agora?",
  ],
];

function pickClarifyingSet(turnIndex: number): string[] {
  return CLARIFYING_QUESTIONS[Math.min(turnIndex, CLARIFYING_QUESTIONS.length - 1)];
}

function isLikelyNoiseInput(input: string): boolean {
  const text = input.trim().toLowerCase();
  if (!text) return true;
  if (text.length <= 2) return true;
  if (/^(?:[\W_]|\d)+$/.test(text)) return true;
  if (/^(?:a+|ha+|kk+|rs+|ok+|oi+|hey+|asdf+|qwe+|teste+|hmm+|hmmm+)$/.test(text)) return true;

  const productIntentHint = /app|aplicativo|mvp|saas|produto|sistema|plataforma|site|api|banco|auth|login|pagamento|stripe|arquitetura|stack|roadmap|ticket|backlog|schema|sql|modelo/i;
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= 4 && !productIntentHint.test(text)) return true;

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

function buildClarifyingResponse(userInput: string, turnIndex: number): string {
  const questions = pickClarifyingSet(turnIndex);
  const intros = [
    "Otimo ponto de partida! Para te dar uma estrategia realmente precisa, preciso entender melhor o contexto:",
    "Interessante. Antes de recomendar uma arquitetura, quero garantir que vou na direcao certa:",
    "Vamos aprofundar isso. Me conta mais alguns detalhes para eu montar uma estrategia sob medida:",
  ];
  const intro = intros[Math.min(turnIndex, intros.length - 1)];
  const formatted = questions.map((q, i) => `${i + 1}. ${q}`).join("\n");
  return `${intro}\n\n${formatted}\n\nResponda o que souber — mesmo que parcialmente, ja consigo construir um plano inicial.`;
}

function buildContextualResponse(userInput: string, history: ChatMessage[]): string {
  const allText = history.map((m) => m.content).join(" ").toLowerCase() + " " + userInput.toLowerCase();

  // Extract signals from the full conversation
  const isSaaS = /saas|b2b|empresa|negocio|assinatura|plano/.test(allText);
  const hasAI = /ia|ai|llm|openai|gpt|claude|intelig[eê]ncia/.test(allText);
  const hasPayments = /pagamento|cobranca|stripe|assinatura|monetiza/.test(allText);
  const hasRealtime = /tempo real|realtime|websocket|chat|notifica/.test(allText);
  const wantsValidation = /validar|validacao|teste|feedback|usuario teste/.test(allText);
  const wantsFastMVP = /rapido|rapida|semanas|1 mes|2 meses|urgente|logo/.test(allText);
  const wantsScale = /escala|crescimento|mil usuarios|performance|concorr/.test(allText);

  const stack = [];
  const phases = [];
  const risks = [];

  // Build stack recommendation
  stack.push("**Stack recomendado:**");
  stack.push("- **Frontend:** Next.js 14 (App Router) + Tailwind CSS");
  if (isSaaS) {
    stack.push("- **Auth + DB:** Supabase (auth, Postgres + RLS por tenant)");
    stack.push("- **Multi-tenancy:** Row-Level Security com `user_id` em todas as tabelas");
  } else {
    stack.push("- **Auth + DB:** Supabase (auth rapida, Postgres com RLS)");
  }
  if (hasAI) {
    stack.push("- **IA:** Edge Function com OpenAI (GPT-4o-mini para custo-beneficio) ou Anthropic Claude");
    stack.push("- **Streaming de respostas:** Supabase Edge Functions com ReadableStream");
  }
  if (hasPayments) {
    stack.push("- **Pagamentos:** Stripe (Checkout + Webhooks + portal do cliente)");
  }
  if (hasRealtime) {
    stack.push("- **Realtime:** Supabase Realtime (Postgres Changes + Broadcast)");
  }
  stack.push("- **Deploy:** Vercel (frontend) + Supabase managed (backend)");
  stack.push("- **Monitoramento:** Vercel Analytics + Sentry para erros");

  // Build phases
  phases.push("\n**Roadmap em 3 fases:**");
  phases.push("\n**Fase 1 — Core funcional** (2-3 semanas)");
  phases.push("- Autenticacao e onboarding do usuario");
  phases.push("- Fluxo principal do produto (1 jornada completa)");
  phases.push("- Banco de dados modelado para o dominio");
  if (wantsValidation) {
    phases.push("- Pagina de waitlist ou acesso early-access para coleta de feedback");
  }

  phases.push("\n**Fase 2 — Inteligencia e valor** (2-3 semanas)");
  if (hasAI) {
    phases.push("- Integracao com LLM via Edge Function");
    phases.push("- Historico de conversas / contexto persistido");
    phases.push("- Controle de tokens e custo por usuario");
  }
  if (hasPayments) {
    phases.push("- Integracao Stripe: planos, checkout e webhooks");
    phases.push("- Controle de acesso por plano (feature flags simples)");
  }
  if (hasRealtime) {
    phases.push("- Canais realtime para notificacoes e colaboracao");
  }
  phases.push("- Dashboard basico com metricas do usuario");

  phases.push("\n**Fase 3 — Escala e retencao** (ongoing)");
  if (wantsScale) {
    phases.push("- Cache de respostas (Redis via Upstash)");
    phases.push("- Rate limiting e cotas de uso por plano");
    phases.push("- Observabilidade: logs estruturados + alertas");
  }
  phases.push("- Testes A/B de onboarding");
  phases.push("- Automacoes de email (boas-vindas, nudge, churn)");

  // Build risks
  risks.push("\n**Principais riscos a mitigar ja no MVP:**");
  if (hasAI) {
    risks.push("- **Custo de inferencia:** use modelos menores (gpt-4o-mini) e cache agressivo de respostas repetidas");
  }
  if (isSaaS) {
    risks.push("- **Multi-tenancy:** valide o RLS do Supabase antes de abrir para usuarios reais");
  }
  if (hasPayments) {
    risks.push("- **Webhooks Stripe:** implemente idempotencia — eventos podem chegar duplicados");
  }
  if (wantsFastMVP) {
    risks.push("- **Velocidade vs divida tecnica:** priorize feature flags em vez de branches — facilita rollback");
  }
  risks.push("- **Autenticacao:** use provedores OAuth (Google/GitHub) — nunca gerencie senha propria no MVP");

  const followUp = "\n\nQuer que eu detalhe alguma dessas fases, escreva os primeiros tickets do backlog, ou defina o modelo de dados para comecar a implementar?";

  return [
    "Com base no que voce me contou, aqui esta minha analise como arquiteto:",
    "",
    stack.join("\n"),
    phases.join("\n"),
    risks.join("\n"),
    followUp,
  ].join("\n");
}

function buildDeepDiveResponse(userInput: string, history: ChatMessage[]): string {
  const lower = userInput.toLowerCase();

  if (/backlog|ticket|tarefa|sprint|historia/.test(lower)) {
    return `Aqui esta um backlog inicial priorizado para seu produto:\n\n**Sprint 1 (Semana 1-2)**\n- [ ] Setup do projeto: Next.js + Supabase + deploy inicial na Vercel\n- [ ] Auth completo: OAuth Google/GitHub + redirect pos-login\n- [ ] Modelo de dados: tabelas principais com RLS\n- [ ] Layout base: sidebar + area principal responsiva\n\n**Sprint 2 (Semana 3-4)**\n- [ ] Fluxo principal do usuario (CRUD da entidade central)\n- [ ] Persistencia e carregamento de estado\n- [ ] Feedback visual: loading states, toasts, error boundaries\n- [ ] Testes manuais com 3-5 usuarios reais\n\n**Sprint 3 (Semana 5-6)**\n- [ ] Feature de maior valor diferencial\n- [ ] Integracao externa prioritaria (pagamento, IA ou outro)\n- [ ] Analytics basico: pageviews + eventos custom\n- [ ] Documentacao minima para onboarding\n\nQuer que eu detalhe alguma dessas tarefas em subtarefas tecnicas?`;
  }

  if (/modelo|banco|schema|tabela|dados/.test(lower)) {
    return `Aqui esta um modelo de dados inicial baseado no que voce descreveu:\n\n\`\`\`sql\n-- Usuarios (gerenciado pelo Supabase Auth)\ncreate table profiles (\n  id uuid references auth.users primary key,\n  email text not null,\n  name text,\n  plan text default 'free',\n  created_at timestamptz default now()\n);\n\n-- Entidade central do seu produto\ncreate table items (\n  id uuid primary key default gen_random_uuid(),\n  user_id uuid references profiles(id) on delete cascade,\n  title text not null,\n  content text,\n  status text default 'active',\n  created_at timestamptz default now(),\n  updated_at timestamptz default now()\n);\n\n-- RLS: usuarios so veem seus proprios dados\nalter table items enable row level security;\ncreate policy "users_own_items" on items\n  for all using (auth.uid() = user_id);\n\`\`\`\n\nAdapte os nomes das tabelas e colunas para o seu dominio. Quer que eu modele algo mais especifico?`;
  }

  if (/monetiza|preco|plano|stripe|pagamento|cobranca/.test(lower)) {
    const stripeLines = [
      "Estrategia de monetizacao recomendada para MVP:",
      "",
      "**Estrutura de planos simples (3 tiers):**",
      "",
      "| Plano | Preco | Limites |",
      "|-------|-------|---------|",
      "| Free | R$0 | 10 itens/mes, sem suporte |",
      "| Pro | R$49/mes | Ilimitado + suporte por email |",
      "| Business | R$149/mes | Pro + analytics + API access |",
      "",
      "**Implementacao com Stripe:**",
      "1. Crie os produtos e precos no Stripe Dashboard",
      "2. Use Stripe Checkout (hosted) — nao implemente formulario proprio",
      "3. Webhook checkout.session.completed → atualiza profiles.plan no Supabase",
      "4. Webhook customer.subscription.deleted → downgrade para Free",
      "5. Portal do cliente via stripe.billingPortal.sessions.create",
      "",
      "**Dica critica:** implemente feature flags no frontend baseadas em profiles.plan — nao dependa de chamadas ao Stripe em tempo real.",
      "",
      "Quer o codigo de exemplo do webhook ou da integracao do Checkout?",
    ];
    return stripeLines.join("\n");
  }

  if (/stack|tecnologia|framework|linguagem/.test(lower)) {
    return `Para um produto com o perfil que voce descreveu, minha recomendacao de stack e:\n\n**Por que Next.js + Supabase?**\n- **Velocidade de entrega:** full-stack em um repositorio, deploy em minutos\n- **Auth pronta:** OAuth, magic link, session management — sem implementar do zero\n- **Banco gerenciado:** Postgres com RLS, migracao simples, backups automaticos\n- **Edge Functions:** logica de backend sem servidor dedicado\n- **Escala horizontal:** Vercel + Supabase escalam sem ops\n\n**Quando essa stack NAO e ideal:**\n- Produto com muito processamento pesado (use workers dedicados)\n- Latencia critica < 50ms no banco (use PlanetScale ou Neon com connection pooling)\n- Time com expertise forte em outro ecossistema (nao mude so por moda)\n\n**Alternativas que vale conhecer:**\n- **Auth:** Clerk (mais rico em features) vs Supabase Auth\n- **DB:** Neon (Postgres serverless com branching) vs Supabase\n- **Deploy:** Railway ou Render se precisar de mais controle de infra\n\nQuer que eu compare alguma alternativa especifica?`;
  }

  // Generic follow-up
  const followUps = [
    "Entendido. Com base na conversa ate agora, vejo tres proximos passos prioritarios:\n\n1. **Validar o modelo de dados** antes de escrever qualquer feature — um schema errado cria divida tecnica cara\n2. **Implementar auth e o fluxo principal** na mesma sprint — sem isso nao da para testar com usuarios reais\n3. **Definir a metrica de sucesso do MVP** — o que precisa acontecer para voce considerar o lancamento um exito?\n\nQual desses voce quer aprofundar?",
    "Boa pergunta. Para responder com precisao, preciso entender melhor: qual e a parte do produto que mais te preocupa tecnicamente agora? (ex: performance, seguranca, custo, velocidade de desenvolvimento)",
    "Isso e um ponto critico. Minha recomendacao e abordar assim:\n\n1. Comece com a solucao mais simples que funciona — otimize depois\n2. Instrumente tudo: logs + metricas desde o inicio\n3. Defina um threshold claro: quando esse ponto vira um problema real, nao hipotetico?\n\nO que mais esta travando o inicio da implementacao?",
  ];

  const idx = history.filter((m) => m.role === "assistant").length % followUps.length;
  return followUps[idx];
}

function localConversationalResponse(userInput: string, history: ChatMessage[]): string {
  if (isLikelyNoiseInput(userInput)) {
    return buildClarifyIntentReply();
  }

  const assistantTurns = history.filter((m) => m.role === "assistant").length;

  // First response: always ask clarifying questions
  if (assistantTurns === 0) {
    return buildClarifyingResponse(userInput, 0);
  }

  // Second response: if user answered questions, check if we have enough context
  if (assistantTurns === 1) {
    const userTurns = history.filter((m) => m.role === "user");
    const totalUserContent = userTurns.map((m) => m.content).join(" ") + " " + userInput;
    const wordCount = totalUserContent.trim().split(/\s+/).length;

    // If user gave a short answer, ask one more round of questions
    if (wordCount < 40) {
      return buildClarifyingResponse(userInput, 1);
    }

    return buildContextualResponse(userInput, [...history, { role: "user", content: userInput }]);
  }

  // Third+ response: deep dive based on what user is asking
  return buildDeepDiveResponse(userInput, [...history, { role: "user", content: userInput }]);
}

// ---------------------------------------------------------------------------
// EDGE FUNCTION HELPERS
// ---------------------------------------------------------------------------

function extractText(data: GenerateAiResponseOutput | null): string | null {
  if (!data || typeof data !== "object") return null;
  const directKeys = ["answer", "text", "output", "content", "message"];
  for (const key of directKeys) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  const response = data.response;
  if (typeof response === "string" && response.trim()) return response;
  const choices = data.choices;
  if (Array.isArray(choices) && choices.length > 0) {
    const first = choices[0] as Record<string, unknown>;
    const message = first?.message as Record<string, unknown> | undefined;
    const content = message?.content;
    if (typeof content === "string" && content.trim()) return content;
  }
  return null;
}

// ---------------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------------

export async function generateAiResponse({
  userInput,
  conversationId,
  history = [],
}: GenerateAiResponseInput): Promise<string> {
  if (isLocalMode) {
    return localConversationalResponse(userInput, history);
  }

  const configuredName = process.env.NEXT_PUBLIC_SUPABASE_AI_FUNCTION ?? "ai-architect";
  const functionCandidates = [configuredName];

  const {
    data: { session },
  } = await supabase.auth.getSession();

  for (const functionName of functionCandidates) {
    const { data, error } = await supabase.functions.invoke<GenerateAiResponseOutput>(
      functionName,
      {
        body: { message: userInput, prompt: userInput, input: userInput, conversationId, history },
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
      }
    );
    if (error) {
      const errorMessage = [error.name, error.message, error.context]
        .filter((part) => typeof part === "string" && part.trim().length > 0)
        .join(" | ");
      if (!hasWarnedEdgeUnavailable && process.env.NODE_ENV !== "production") {
        console.warn(`Edge Function '${functionName}' indisponivel.`, errorMessage || error);
        hasWarnedEdgeUnavailable = true;
      }
      continue;
    }
    const text = extractText(data);
    if (text) return text;
  }

  // Keep chat usable even if remote AI is unstable.
  return localConversationalResponse(userInput, history);
}
