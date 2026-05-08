/**
 * Generates a concise conversation title from the first user message.
 * Tries the AI Edge Function for a smart title; falls back to extraction.
 */
export async function generateTitle(
  userMessage: string,
  conversationId: string,
  accessToken: string
): Promise<string> {
  const aiMode = (process.env.NEXT_PUBLIC_AI_MODE ?? "local").toLowerCase();
  const isLocalMode = aiMode !== "remote";

  if (isLocalMode) {
    return extractTitle(userMessage);
  }

  const functionUrl = process.env.NEXT_PUBLIC_SUPABASE_AI_FUNCTION;

  if (functionUrl) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const url = `${supabaseUrl}/functions/v1/${functionUrl}`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: userMessage,
          mode: "title",
          prompt:
            "Generate a very short (3-6 words) Portuguese conversation title for this message. Return only the title, no punctuation.",
        }),
        signal: AbortSignal.timeout(4000),
      });

      if (res.ok) {
        const data = await res.json();
        const title =
          data?.title ||
          data?.answer ||
          data?.text ||
          data?.output ||
          data?.content ||
          data?.message;

        if (title && typeof title === "string" && title.trim().length > 0) {
          return capitalize(title.trim().replace(/['"]+/g, "").substring(0, 60));
        }
      }
    } catch {
      // fall through to local extraction
    }
  }

  return extractTitle(userMessage);
}

function extractTitle(message: string): string {
  // Strip leading symbols and whitespace
  const cleaned = message.replace(/^[#\-*>\s]+/, "").trim();

  // Take first sentence or first 55 chars
  const firstSentence = cleaned.split(/[.!?\n]/)[0].trim();
  const raw = firstSentence.length > 8 ? firstSentence : cleaned;

  return capitalize(raw.substring(0, 55));
}

function capitalize(str: string): string {
  if (!str) return "Novo chat";
  return str.charAt(0).toUpperCase() + str.slice(1);
}
