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
import { useAuth } from "../auth/AuthContext";
import { Link } from "react-router-dom";
export interface ChatLayoutProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  onSend: (content: string) => void | Promise<void>;
}

export function ChatLayout({ messages, isLoading, error, onSend }: ChatLayoutProps) {
  const { user, logout } = useAuth();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleLastAssistantRevealComplete = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="chat-layout">
      <Header />
      <div className="chat-body">
        <div className="chat-container">
          <div className="chat-toolbar">
            <div className="chat-user">
              <span className="chat-user-name">{user?.profile?.name || user?.email}</span>
              <span className="chat-user-language">{user?.profile?.language ?? "en"}</span>
            </div>
            <div className="chat-toolbar-actions">
              <Link to="/settings">Settings</Link>
              <button type="button" onClick={logout} className="secondary-btn">
                Sign out
              </button>
            </div>
          </div>
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
      </div>
    </div>
  );
}
