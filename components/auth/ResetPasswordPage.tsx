import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) {
      setError("Missing reset token.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to reset password";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <h1>Choose a new password</h1>
      <p className="auth-subtitle">Make sure your new password is memorable and secure.</p>

      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          New password
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
          Confirm password
          <input
            type="password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
        </label>

        {error && <p className="auth-error">{error}</p>}
        {success && <p className="auth-success">Password updated. Redirecting…</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>

      <div className="auth-links">
        <Link to="/login">Back to sign in</Link>
      </div>
    </div>
  );
}
