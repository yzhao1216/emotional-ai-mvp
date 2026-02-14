/**
 * API client for chat. Calls our backend proxy (/api/chat), which calls Anthropic.
 * The API key lives only on the server (ANTHROPIC_API_KEY in .env).
 */

export type ChatApiMessage = { role: "user" | "assistant" | "system"; content: string };

export interface ChatApiOptions {
  systemPrompt: string;
  messages: ChatApiMessage[];
}

/**
 * Call backend /api/chat; returns raw assistant reply. No API key in the browser.
 */
export async function fetchAssistantReply(
  opts: ChatApiOptions & { accessToken?: string }
): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(opts.accessToken ? { Authorization: `Bearer ${opts.accessToken}` } : {}),
    },
    body: JSON.stringify({
      systemPrompt: opts.systemPrompt,
      messages: opts.messages,
    }),
  });

  const data = (await res.json()) as { content?: string; error?: string };

  if (!res.ok) {
    throw new Error(data.error ?? res.statusText);
  }

  return (data.content ?? "").trim();
}
