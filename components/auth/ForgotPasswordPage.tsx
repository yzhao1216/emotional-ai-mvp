import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await requestPasswordReset(email);
      setSubmitted(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to send reset link";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <h1>Reset your password</h1>
      <p className="auth-subtitle">
        Enter your account email and we&apos;ll send a reset link if it exists.
      </p>

      {submitted ? (
        <p className="auth-success">
          If an account exists for {email}, a reset link has been sent. Check your inbox and spam
          folder.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}

      <div className="auth-links">
        <Link to="/login">Back to sign in</Link>
      </div>
    </div>
  );
}
