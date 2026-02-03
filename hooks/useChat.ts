/**
 * Chat state and send flow: messages, loading, error; calls lib/chat + lib/api.
 */

import { useState, useCallback } from "react";
import { fetchAssistantReply } from "../lib/api";
import {
  buildSystemPrompt,
  processAssistantReply,
} from "../lib/chat";
import type { ChatMessage } from "../lib/types";

function nextId(): string {
  return crypto.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: nextId(),
      role: "user",
      content: trimmed,
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    try {
      const systemPrompt = buildSystemPrompt();
      const apiMessages = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: trimmed },
      ];
      const rawReply = await fetchAssistantReply({
        systemPrompt,
        messages: apiMessages,
      });
      const processed = processAssistantReply(rawReply, trimmed);
      const assistantMsg: ChatMessage = {
        id: nextId(),
        role: "assistant",
        content: processed,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  return { messages, isLoading, error, sendMessage };
}
