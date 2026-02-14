import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("en");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register({ email, password, name, language });
      navigate("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to register";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <h1>Create your account</h1>
      <p className="auth-subtitle">Join Anchor and pick up where you left off.</p>

      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          Name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Optional"
          />
        </label>

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
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </label>

        <label>
          Preferred language
          <input
            type="text"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            placeholder="en"
          />
        </label>

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>

      <div className="auth-links">
        <Link to="/login">Back to sign in</Link>
      </div>
    </div>
  );
}
