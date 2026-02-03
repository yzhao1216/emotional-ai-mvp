/**
 * Text field + send button; disabled while sending.
 * Ref forwarded to textarea for post-reveal focus.
 */

import { useState, useCallback, forwardRef } from "react";
import { Button } from "../ui/Button";

export interface ChatInputProps {
  onSend: (content: string) => void | Promise<void>;
  disabled?: boolean;
}

export const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(
  function ChatInput({ onSend, disabled }, ref) {
    const [value, setValue] = useState("");

    const handleSubmit = useCallback(
      (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = value.trim();
        if (!trimmed || disabled) return;
        onSend(trimmed);
        setValue("");
      },
      [value, disabled, onSend]
    );

    return (
      <form className="chat-input" onSubmit={handleSubmit}>
        <textarea
          ref={ref}
          className="chat-input__field"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type a message…"
          rows={2}
          disabled={disabled}
          aria-label="Message"
        />
        <Button type="submit" disabled={disabled || !value.trim()}>
          Send
        </Button>
      </form>
    );
  }
);
