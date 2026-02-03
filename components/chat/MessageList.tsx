/**
 * Scrollable list of messages; auto-scroll to bottom.
 * Passes onRevealComplete to the last message when it's from the assistant (for refocus).
 */

import { useEffect, useRef } from "react";
import { Message } from "./Message";
import type { ChatMessage } from "../../lib/types";

export interface MessageListProps {
  messages: ChatMessage[];
  onLastAssistantRevealComplete?: () => void;
}

export function MessageList({ messages, onLastAssistantRevealComplete }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const lastMessage = messages[messages.length - 1];
  const isLastAssistant = lastMessage?.role === "assistant";

  return (
    <div className="message-list" role="log" aria-live="polite">
      {messages.map((msg) => (
        <Message
          key={msg.id}
          message={msg}
          onRevealComplete={
            isLastAssistant && msg.id === lastMessage?.id
              ? onLastAssistantRevealComplete
              : undefined
          }
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
