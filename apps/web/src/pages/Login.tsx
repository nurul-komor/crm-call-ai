import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { postJson } from '@/lib/api';
import { useAuthStore, type AuthUser } from '@/lib/authStore';

interface LoginForm {
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export function LoginPage() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm<LoginForm>();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(values: LoginForm) {
    setBusy(true);
    setErr(null);
    try {
      const res = await postJson<LoginResponse>('auth/login', values);
      setAuth({ accessToken: res.accessToken, refreshToken: res.refreshToken }, res.user);
      navigate('/customers');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg text-text grid lg:grid-cols-[1fr_1.1fr] overflow-hidden">
      <div className="relative flex items-center justify-center px-6 py-12">
        <div
          className="absolute inset-0 opacity-60 pointer-events-none"
          style={{
            background:
              'radial-gradient(80% 60% at 50% 0%, hsl(var(--accent) / 0.18), transparent 70%)',
          }}
        />
        <div className="relative w-full max-w-sm space-y-8">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-md bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-white font-bold">
              V
            </div>
            <span className="text-lg font-semibold">VoiceFlow AI</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tightest">Welcome back</h1>
            <p className="text-base text-text-secondary">
              Sign in to dispatch outbound AI conversations.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label="Email" htmlFor="email">
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                {...register('email', { required: true })}
              />
            </Field>
            <Field label="Password" htmlFor="password">
              <Input
                id="password"
                type="password"
                placeholder="••••••••••••"
                autoComplete="current-password"
                {...register('password', { required: true })}
              />
            </Field>
            {err && (
              <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {err}
              </div>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
              {!busy && <ArrowRight size={16} />}
            </Button>
            <p className="text-sm text-text-secondary text-center pt-2">
              No account yet?{' '}
              <Link to="/signup" className="font-semibold text-accent-light hover:underline">
                Create a workspace
              </Link>
            </p>
          </form>
        </div>
      </div>

      <div className="hidden lg:flex relative items-center justify-center overflow-hidden border-l border-border bg-surface">
        <div
          className="absolute inset-0 opacity-80"
          style={{
            background:
              'radial-gradient(60% 80% at 70% 30%, hsl(var(--accent) / 0.22), transparent 65%), radial-gradient(40% 50% at 30% 90%, hsl(294 75% 50% / 0.15), transparent 60%)',
          }}
        />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="relative z-10 max-w-md px-8 space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border-light bg-surface-2/60 backdrop-blur text-xs font-semibold text-text-secondary">
            <Sparkles size={12} className="text-accent-light" />
            What's new — Voice agent v2
          </div>
          <h2 className="text-4xl font-bold leading-tight tracking-tightest">
            Conversations that convert, on autopilot.
          </h2>
          <p className="text-base text-text-secondary leading-relaxed">
            Launch outbound voice, WhatsApp, and SMS campaigns from one dashboard. Track every call
            live, score leads automatically, and let your team focus only on the warmest replies.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              ['98.4%', 'Pickup rate'],
              ['2.1s', 'First-token latency'],
              ['44%', 'Higher conversion'],
            ].map(([value, label]) => (
              <div key={label} className="space-y-1">
                <div className="text-2xl font-bold text-text font-mono tabular-nums">{value}</div>
                <div className="text-2xs uppercase tracking-wider text-text-tertiary">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
