import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./layout";
import { ChatLayout } from "../components/chat/ChatLayout";
import { useChat } from "../hooks/useChat";
import { AuthProvider, useAuth } from "../components/auth/AuthContext";
import { LoginPage } from "../components/auth/LoginPage";
import { RegisterPage } from "../components/auth/RegisterPage";
import { ForgotPasswordPage } from "../components/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "../components/auth/ResetPasswordPage";
import { ProfileSettings } from "../components/auth/ProfileSettings";

function ChatPage() {
  const { messages, isLoading, error, sendMessage } = useChat();
  return (
    <ChatLayout
      messages={messages}
      isLoading={isLoading}
      error={error}
      onSend={sendMessage}
    />
  );
}

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-card">
        <p className="auth-subtitle">Signing you in…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <ProfileSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}
