/**
 * Main app: chat layout with message list and input.
 */

import { Layout } from "./layout";
import { ChatLayout } from "../components/chat/ChatLayout";
import { useChat } from "../hooks/useChat";

export function App() {
  const { messages, isLoading, error, sendMessage } = useChat();

  return (
    <Layout>
      <ChatLayout
        messages={messages}
        isLoading={isLoading}
        error={error}
        onSend={sendMessage}
      />
    </Layout>
  );
}
