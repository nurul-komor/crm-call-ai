import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { postJson } from '@/lib/api';
import { useAuthStore, type AuthUser } from '@/lib/authStore';

interface SignupResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

function AuthLogo() {
  return (
    <Link
      to="/"
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        fontWeight: 700,
        fontSize: 22,
        letterSpacing: '-0.02em',
        color: 'hsl(var(--text))',
        textDecoration: 'none',
      }}
    >
      Calls<span style={{ color: '#FF6B5C', fontWeight: 800, margin: '0 1px' }}>.</span>
      <span
        style={{
          background: 'linear-gradient(135deg, #3B82F6 0%, #FF6B5C 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontWeight: 800,
          fontStyle: 'italic',
        }}
      >
        Ai
      </span>
    </Link>
  );
}

function AuthAuroras() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div
        className="auth-aurora"
        style={{
          top: '-10%',
          left: '-10%',
          width: 500,
          height: 500,
          background: 'radial-gradient(circle, rgba(37,99,235,0.12), transparent 70%)',
          animation: 'aurora1 30s ease-in-out infinite',
        }}
      />
      <div
        className="auth-aurora"
        style={{
          bottom: '-10%',
          right: '20%',
          width: 400,
          height: 400,
          background: 'radial-gradient(circle, rgba(59,130,246,0.08), transparent 70%)',
          animation: 'aurora2 24s ease-in-out 5s infinite',
        }}
      />
    </div>
  );
}

function SocialButtons() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      <button type="button" className="sso-btn">
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Google
      </button>
      <button type="button" className="sso-btn">
        <svg width="14" height="14" viewBox="0 0 24 24">
          <path fill="#F25022" d="M1 1h10v10H1z" />
          <path fill="#7FBA00" d="M13 1h10v10H13z" />
          <path fill="#00A4EF" d="M1 13h10v10H1z" />
          <path fill="#FFB900" d="M13 13h10v10H13z" />
        </svg>
        Microsoft
      </button>
    </div>
  );
}

function PasswordInput({
  value,
  onChange,
  placeholder = '••••••••',
  id,
  name,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  id?: string;
  name?: string;
}) {
  const [shown, setShown] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        id={id}
        name={name}
        className="auth-input"
        type={shown ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ paddingRight: 40 }}
        autoComplete="new-password"
      />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        style={{
          position: 'absolute',
          right: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 28,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'hsl(var(--text-tertiary))',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
        aria-label={shown ? 'Hide password' : 'Show password'}
      >
        {shown ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
            <line x1="2" x2="22" y1="2" y2="22" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}

function passwordStrength(p: string): number {
  let score = 0;
  if (p.length >= 12) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  return score;
}

function BrandPanel({
  quote,
  author,
  role,
  company,
  avatar,
}: {
  quote: string;
  author: string;
  role: string;
  company: string;
  avatar: string;
}) {
  return (
    <div className="auth-right">
      <AuthAuroras />
      <div className="auth-testimonial">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="hsl(var(--accent))"
          style={{ opacity: 0.5, marginBottom: 18, display: 'block' }}
        >
          <path d="M6 17h3l2-4V7H5v6h3l-2 4zm8 0h3l2-4V7h-6v6h3l-2 4z" />
        </svg>
        <p
          style={{
            fontSize: 18,
            lineHeight: 1.55,
            color: 'hsl(var(--text))',
            marginBottom: 22,
            fontWeight: 500,
            letterSpacing: '-0.01em',
          }}
        >
          "{quote}"
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src={avatar}
            alt={author}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: '2px solid hsl(var(--border))',
            }}
          />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{author}</div>
            <div style={{ fontSize: 12, color: 'hsl(var(--text-tertiary))' }}>
              {role} · {company}
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: 28,
            paddingTop: 22,
            borderTop: '1px solid hsl(var(--border))',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
          }}
        >
          {[
            { val: '24k+', label: 'Teams' },
            { val: '99.9%', label: 'Uptime' },
            { val: '29+', label: 'Languages' },
          ].map((s) => (
            <div key={s.label}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: 'hsl(var(--accent-light))',
                }}
              >
                {s.val}
              </div>
              <div
                style={{
                  fontSize: 10.5,
                  color: 'hsl(var(--text-tertiary))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AuthFooter() {
  return (
    <div
      style={{
        display: 'flex',
        gap: 16,
        fontSize: 12,
        color: 'hsl(var(--text-tertiary))',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <span>© 2026 VoiceFlow AI</span>
      <div style={{ display: 'flex', gap: 14 }}>
        <a href="#" className="auth-link" style={{ fontSize: 12 }}>Terms</a>
        <a href="#" className="auth-link" style={{ fontSize: 12 }}>Privacy</a>
        <a href="#" className="auth-link" style={{ fontSize: 12 }}>Security</a>
      </div>
    </div>
  );
}

function ArrowRight() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="50 30" opacity="0.5" />
    </svg>
  );
}

const STRENGTH_LABELS = ['Too short', 'Weak', 'Okay', 'Strong', 'Excellent'];
const STRENGTH_COLORS = [
  'hsl(var(--text-tertiary))',
  'hsl(var(--danger))',
  'hsl(var(--warning))',
  'hsl(var(--success))',
  'hsl(var(--success))',
];

export function SignupPage() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', company: '', password: '' });
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const strength = passwordStrength(form.password);
  const strengthLabel = STRENGTH_LABELS[strength];
  const strengthColor = STRENGTH_COLORS[strength];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    const parts = form.name.trim().split(/\s+/);
    const firstName = parts[0] ?? form.name.trim();
    const lastName = parts.slice(1).join(' ') || firstName;
    try {
      const res = await postJson<SignupResponse>('auth/signup', {
        firstName,
        lastName,
        email: form.email,
        companyName: form.company,
        password: form.password,
      });
      setAuth({ accessToken: res.accessToken, refreshToken: res.refreshToken }, res.user);
      navigate('/dashboard');
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-left">
        <AuthAuroras />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <AuthLogo />
        </div>

        <div
          className="auth-form-wrap"
          style={{ position: 'relative', zIndex: 1, paddingTop: 32, paddingBottom: 32 }}
        >
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '5px 12px',
                borderRadius: 999,
                border: '1px solid hsl(var(--accent-light) / 0.3)',
                background: 'hsl(var(--accent-light) / 0.08)',
                fontSize: 12.5,
                fontWeight: 600,
                color: 'hsl(var(--accent-light))',
                marginBottom: 16,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'hsl(var(--success))',
                  animation: 'pulse 2s infinite',
                  display: 'inline-block',
                }}
              />
              14-day free trial · No card required
            </div>
            <h1
              style={{
                fontSize: 30,
                fontWeight: 700,
                letterSpacing: '-0.025em',
                lineHeight: 1.15,
                marginBottom: 8,
              }}
            >
              Start your free trial
            </h1>
            <p style={{ fontSize: 14.5, color: 'hsl(var(--text-secondary))' }}>
              Launch your first AI campaign in under 10 minutes.
            </p>
          </div>

          <SocialButtons />
          <div className="auth-divider">or with email</div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div className="auth-label">Full name</div>
                <input
                  id="name"
                  name="name"
                  className="auth-input"
                  required
                  value={form.name}
                  onChange={update('name')}
                  placeholder="Alex Chen"
                  autoComplete="name"
                />
              </div>
              <div>
                <div className="auth-label">Company</div>
                <input
                  id="organization"
                  name="organization"
                  className="auth-input"
                  required
                  value={form.company}
                  onChange={update('company')}
                  placeholder="Acme Corp"
                  autoComplete="organization"
                />
              </div>
            </div>

            <div>
              <div className="auth-label">Work email</div>
              <input
                id="email"
                name="email"
                className="auth-input"
                type="email"
                required
                value={form.email}
                onChange={update('email')}
                placeholder="you@company.com"
                autoComplete="email"
              />
            </div>

            <div>
              <div className="auth-label">
                Password
                {form.password && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: strengthColor }}>
                    {strengthLabel}
                  </span>
                )}
              </div>
              <PasswordInput
                id="password"
                name="password"
                value={form.password}
                onChange={update('password')}
                placeholder="At least 8 characters"
              />
              {form.password && (
                <div style={{ display: 'flex', gap: 4, marginTop: 7 }}>
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: 3,
                        borderRadius: 2,
                        background: i <= strength ? strengthColor : 'hsl(var(--border))',
                        transition: 'background 0.2s ease',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            <label className="auth-checkbox" style={{ alignItems: 'flex-start', marginTop: 4 }}>
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                style={{ marginTop: 2 }}
              />
              <span>
                I agree to the{' '}
                <a href="#" className="auth-link" style={{ fontSize: 12.5 }}>Terms of Service</a>{' '}
                and{' '}
                <a href="#" className="auth-link" style={{ fontSize: 12.5 }}>Privacy Policy</a>
              </span>
            </label>

            {err && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid hsl(var(--danger) / 0.3)',
                  background: 'hsl(var(--danger) / 0.1)',
                  fontSize: 13,
                  color: 'hsl(var(--danger))',
                }}
              >
                {err}
              </div>
            )}

            <button type="submit" className="auth-submit" disabled={loading || !agreed}>
              {loading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Spinner />
                  Creating account...
                </span>
              ) : (
                <>
                  Create free account <ArrowRight />
                </>
              )}
            </button>
          </form>

          <div
            style={{
              marginTop: 22,
              fontSize: 13.5,
              color: 'hsl(var(--text-secondary))',
              textAlign: 'center',
            }}
          >
            Already have an account?{' '}
            <Link to="/login" className="auth-link" style={{ fontSize: 13.5 }}>
              Sign in
            </Link>
          </div>
        </div>

        <AuthFooter />
      </div>

      <BrandPanel
        quote="The fastest way to launch enterprise-grade AI conversations. We had 10,000 calls running by end of day one."
        author="David Park"
        role="Head of Growth"
        company="Meridian Finance"
        avatar="https://i.pravatar.cc/120?img=14"
      />
    </div>
  );
}
