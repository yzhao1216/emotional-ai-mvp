/**
 * Single message bubble (user vs assistant).
 * Assistant messages use AssistantMessageReveal for calm sequential reveal.
 */

import type { ChatMessage as ChatMessageType } from "../../lib/types";
import { AssistantMessageReveal } from "./AssistantMessageReveal";

export interface MessageProps {
  message: ChatMessageType;
  onRevealComplete?: () => void;
}

export function Message({ message, onRevealComplete }: MessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`message message--${message.role}`} data-role={message.role}>
      <div className="message__content">
        {isUser ? (
          message.content
        ) : (
          <AssistantMessageReveal content={message.content} onRevealComplete={onRevealComplete} />
        )}
      </div>
    </div>
  );
}
