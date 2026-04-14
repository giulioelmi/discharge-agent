import { useState, ReactNode } from 'react';
import { Activity } from 'lucide-react';

const SESSION_KEY = 'demo_authed';

const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL as string | undefined;
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD as string | undefined;

// If no credentials are configured, bypass the gate (local dev)
const AUTH_ENABLED = Boolean(DEMO_EMAIL && DEMO_PASSWORD);

export default function LoginGate({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(
    !AUTH_ENABLED || sessionStorage.getItem(SESSION_KEY) === 'true'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (authed) return <>{children}</>;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim() === DEMO_EMAIL && password === DEMO_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      setAuthed(true);
    } else {
      setError('Incorrect email or password. Please try again.');
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        {/* Logo / Brand */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="bg-teal-500 text-white rounded-lg p-2">
            <Activity size={22} />
          </div>
          <span className="text-xl font-bold text-slate-800 tracking-tight">FlowBoard</span>
        </div>

        <h2 className="text-center text-slate-600 text-sm mb-6">
          Sign in to access the discharge dashboard
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
