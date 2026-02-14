import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaToken, setMfaToken] = useState("");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ email, password, mfaToken: mfaRequired ? mfaToken : undefined });
      navigate("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to login";
      if (message === "MFA_REQUIRED") {
        setMfaRequired(true);
        setError("Enter your authentication code.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <h1>Welcome back</h1>
      <p className="auth-subtitle">Sign in to continue your conversation.</p>

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
        <label>
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>

        {mfaRequired && (
          <label>
            Authentication code
            <input
              type="text"
              required
              value={mfaToken}
              onChange={(e) => setMfaToken(e.target.value)}
              placeholder="123456"
              inputMode="numeric"
            />
          </label>
        )}

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="auth-links">
        <Link to="/register">Create an account</Link>
        <Link to="/forgot-password">Forgot password?</Link>
      </div>
    </div>
  );
}
