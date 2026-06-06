import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { postJson } from '@/lib/api';
import { useAuthStore, type AuthUser } from '@/lib/authStore';

interface SignupForm {
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface SignupResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

const PERKS = [
  'Outbound phone calls (Twilio + ElevenLabs)',
  'Live monitor with real-time transcripts',
  'Per-call lead scoring & data extraction',
  'Bring your own OpenAI / Claude / Gemini key',
];

export function SignupPage() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm<SignupForm>();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(values: SignupForm) {
    setBusy(true);
    setErr(null);
    try {
      const res = await postJson<SignupResponse>('auth/signup', values);
      setAuth({ accessToken: res.accessToken, refreshToken: res.refreshToken }, res.user);
      navigate('/customers');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Signup failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg text-text grid lg:grid-cols-[1.1fr_1fr]">
      <div className="hidden lg:flex relative items-center justify-center overflow-hidden border-r border-border bg-surface">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(60% 80% at 30% 30%, hsl(var(--accent) / 0.20), transparent 65%)',
          }}
        />
        <div className="relative z-10 max-w-md px-8 space-y-8">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-md bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-white font-bold">
              V
            </div>
            <span className="text-lg font-semibold">VoiceFlow AI</span>
          </div>
          <h2 className="text-4xl font-bold leading-tight tracking-tightest">
            Start your workspace in under a minute.
          </h2>
          <ul className="space-y-3">
            {PERKS.map((p) => (
              <li key={p} className="flex items-start gap-3 text-base text-text-secondary">
                <span className="mt-0.5 h-5 w-5 rounded-full bg-success/15 text-success flex items-center justify-center shrink-0">
                  <Check size={12} strokeWidth={3} />
                </span>
                {p}
              </li>
            ))}
          </ul>
          <p className="text-sm text-text-tertiary pt-4">
            14-day free trial. No credit card required.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-2 lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-md bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-white font-bold text-sm">
                V
              </div>
              <span className="text-lg font-semibold">VoiceFlow AI</span>
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tightest">Create your workspace</h1>
            <p className="text-base text-text-secondary">
              Spin up your tenant and admin user. You can invite teammates next.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label="Company name" htmlFor="companyName">
              <Input
                id="companyName"
                placeholder="Acme Co."
                {...register('companyName', { required: true })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name" htmlFor="firstName">
                <Input id="firstName" {...register('firstName', { required: true })} />
              </Field>
              <Field label="Last name" htmlFor="lastName">
                <Input id="lastName" {...register('lastName', { required: true })} />
              </Field>
            </div>
            <Field label="Work email" htmlFor="email">
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                {...register('email', { required: true })}
              />
            </Field>
            <Field
              label="Password"
              htmlFor="password"
              hint="12+ characters, with a letter and a digit."
            >
              <Input
                id="password"
                type="password"
                placeholder="••••••••••••"
                {...register('password', { required: true, minLength: 12 })}
              />
            </Field>
            {err && (
              <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {err}
              </div>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? 'Creating workspace…' : 'Create workspace'}
              {!busy && <ArrowRight size={16} />}
            </Button>
            <p className="text-sm text-text-secondary text-center">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-accent-light hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
