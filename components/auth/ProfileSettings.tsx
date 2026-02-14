import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

export function ProfileSettings() {
  const { user, updateProfile, setupMfa, verifyMfa, disableMfa } = useAuth();
  const [name, setName] = useState(user?.profile?.name ?? "");
  const [language, setLanguage] = useState(user?.profile?.language ?? "en");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mfa, setMfa] = useState<{ qrDataUrl: string; otpauthUrl: string } | null>(null);
  const [mfaToken, setMfaToken] = useState("");
  const hasMfaEnabled = user?.hasMfaEnabled ?? false;

  useEffect(() => {
    setName(user?.profile?.name ?? "");
    setLanguage(user?.profile?.language ?? "en");
  }, [user]);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await updateProfile({ name, language });
      setMessage("Profile updated.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to save profile.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleSetupMfa = async () => {
    setError(null);
    setMessage(null);
    try {
      const data = await setupMfa();
      setMfa(data);
      setMessage("Scan the QR code and enter the code to confirm.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to start MFA setup.";
      setError(msg);
    }
  };

  const handleVerifyMfa = async () => {
    setError(null);
    setMessage(null);
    try {
      await verifyMfa(mfaToken);
      setMfa(null);
      setMfaToken("");
      setMessage("MFA enabled.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to verify MFA.";
      setError(msg);
    }
  };

  const handleDisableMfa = async () => {
    setError(null);
    setMessage(null);
    try {
      await disableMfa();
      setMessage("MFA disabled.");
      setMfa(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to disable MFA.";
      setError(msg);
    }
  };

  return (
    <div className="auth-card">
      <h1>Your profile</h1>
      <p className="auth-subtitle">Adjust how Anchor greets and supports you.</p>

      <form onSubmit={handleSave} className="auth-form">
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          Preferred language
          <input value={language} onChange={(e) => setLanguage(e.target.value)} />
        </label>

        {error && <p className="auth-error">{error}</p>}
        {message && <p className="auth-success">{message}</p>}

        <button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>

      <section className="mfa-section">
        <h2>Two-factor authentication</h2>
        <p>
          Add an extra layer of security with an authenticator app. You&apos;ll need to enter a code
          each time you sign in.
        </p>

        {hasMfaEnabled ? (
          <button type="button" className="secondary-btn" onClick={handleDisableMfa}>
            Disable MFA
          </button>
        ) : (
          <button type="button" className="secondary-btn" onClick={handleSetupMfa}>
            Set up MFA
          </button>
        )}

        {mfa && (
          <div className="mfa-setup">
            <img src={mfa.qrDataUrl} alt="Scan with authenticator app" />
            <label>
              Enter the 6-digit code
              <input
                value={mfaToken}
                onChange={(e) => setMfaToken(e.target.value)}
                placeholder="123456"
                inputMode="numeric"
              />
            </label>
            <button type="button" onClick={handleVerifyMfa} disabled={!mfaToken}>
              Verify and enable
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
