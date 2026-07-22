import { FormEvent, useState } from "react";
import { KeyRound, Lock } from "lucide-react";
import { AuthState, PersistenceProvider } from "../../persistence";
import { Button } from "../../shared/components/Button";

export function AuthGate({ provider, auth, setAuth, mode = "signIn", onRecoveryComplete }: { provider: PersistenceProvider; auth: AuthState; setAuth: (state: AuthState) => void; mode?: "signIn" | "recovery"; onRecoveryComplete?: () => void }) {
  if (mode === "recovery") return <PasswordRecoveryGate provider={provider} auth={auth} setAuth={setAuth} onRecoveryComplete={onRecoveryComplete} />;
  return <SignInGate provider={provider} auth={auth} setAuth={setAuth} />;
}

function SignInGate({ provider, auth, setAuth }: { provider: PersistenceProvider; auth: AuthState; setAuth: (state: AuthState) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [attempted, setAttempted] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!provider.signInWithPassword || submitting) return;
    setAttempted(true);
    setSubmitting(true);
    try {
      const next = await provider.signInWithPassword(email.trim(), password);
      setAuth(next);
    } finally {
      setSubmitting(false);
    }
  }
  return <main className="auth-shell">
    <form className="panel auth-panel" onSubmit={submit}>
      <div className="panel-title"><Lock aria-hidden="true" /><h1>ToDonut</h1><p>Sign in to continue to ToDonut.</p></div>
      <label className="form-row"><span>Email</span><input className="field" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      <label className="form-row"><span>Password</span><input className="field" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      {auth.error && attempted && <p className="field-error">{auth.error}</p>}
      <Button type="submit" variant="primary" disabled={!email.trim() || !password || submitting}>{submitting ? "Signing in..." : "Sign in"}</Button>
    </form>
  </main>;
}

function PasswordRecoveryGate({ provider, auth, setAuth, onRecoveryComplete }: { provider: PersistenceProvider; auth: AuthState; setAuth: (state: AuthState) => void; onRecoveryComplete?: () => void }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const localError = password && password.length < 8 ? "Use at least 8 characters." : password && confirmPassword && password !== confirmPassword ? "Passwords do not match." : null;
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!provider.updatePassword || submitting || localError || !password || !confirmPassword) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const next = await provider.updatePassword(password);
      setAuth(next);
      if (next.ready && !next.error) {
        setPassword("");
        setConfirmPassword("");
        setMessage("Password updated. You can use it to sign in on your other devices.");
      }
    } finally {
      setSubmitting(false);
    }
  }
  return <main className="auth-shell">
    <form className="panel auth-panel" onSubmit={submit}>
      <div className="panel-title"><KeyRound aria-hidden="true" /><h1>Set Password</h1><p>Choose a new password for your ToDonut owner account.</p></div>
      <label className="form-row"><span>New password</span><input className="field" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      <label className="form-row"><span>Confirm password</span><input className="field" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>
      {(localError || auth.error) && <p className="field-error">{localError ?? auth.error}</p>}
      {message && <p className="inline-note">{message}</p>}
      <div className="auth-actions">
        <Button type="submit" variant="primary" disabled={!password || !confirmPassword || Boolean(localError) || submitting}>{submitting ? "Updating..." : "Update password"}</Button>
        {message && <Button type="button" variant="ghost" onClick={onRecoveryComplete}>Continue</Button>}
      </div>
    </form>
  </main>;
}
