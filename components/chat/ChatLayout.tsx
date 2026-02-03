/**
 * Full chat view: header, message list or empty state, presence indicator, input.
 */

import { useRef, useCallback } from "react";
import type { ChatMessage } from "../../lib/types";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { EmptyState } from "./EmptyState";
import { PresenceIndicator } from "./PresenceIndicator";
import { Header } from "../ui/Header";
export interface ChatLayoutProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  onSend: (content: string) => void | Promise<void>;
}

export function ChatLayout({
  messages,
  isLoading,
  error,
  onSend,
}: ChatLayoutProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleLastAssistantRevealComplete = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="chat-layout">
      <Header />
      {messages.length === 0 && !isLoading ? (
        <EmptyState />
      ) : (
        <MessageList
          messages={messages}
          onLastAssistantRevealComplete={handleLastAssistantRevealComplete}
        />
      )}
      {isLoading && <PresenceIndicator />}
      {error && <div className="chat-error" role="alert">{error}</div>}
      <ChatInput ref={inputRef} onSend={onSend} disabled={isLoading} />
    </div>
  );
}
