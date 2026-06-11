/**
 * Server-only Ollama client.
 *
 * Beacon talks to a local Ollama instance instead of a hosted API — no key,
 * nothing leaves the machine. Defaults to qwen3:8b, a general instruct model
 * that writes natural founder-facing prose. Override with env vars if needed.
 */

export const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";

export const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen3:8b";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type OllamaChatResponse = {
  message?: { content?: string };
};

/**
 * qwen3 is a thinking model — it can wrap reasoning in <think>…</think> tags.
 * We disable thinking on the request, but strip any stray tags defensively so
 * the caller always gets a clean one-liner.
 */
function stripThinkTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

export async function ollamaChat(
  messages: ChatMessage[],
  opts: { numPredict?: number; temperature?: number } = {},
): Promise<string> {
  const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      think: false, // suppress qwen3's reasoning blocks
      messages,
      options: {
        temperature: opts.temperature ?? 0.7,
        num_predict: opts.numPredict ?? 120,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Ollama request failed (${res.status})`);
  }

  const data = (await res.json()) as OllamaChatResponse;
  return stripThinkTags(data.message?.content ?? "");
}
