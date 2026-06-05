import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
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
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create your workspace</CardTitle>
          <CardDescription>
            New to VoiceFlow AI? Set up your tenant and admin user.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-sm font-medium" htmlFor="companyName">
                Company name
              </label>
              <Input id="companyName" {...register('companyName', { required: true })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium" htmlFor="firstName">
                  First name
                </label>
                <Input id="firstName" {...register('firstName', { required: true })} />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="lastName">
                  Last name
                </label>
                <Input id="lastName" {...register('lastName', { required: true })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <Input id="email" type="email" {...register('email', { required: true })} />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="password">
                Password (12+ chars, letter + digit)
              </label>
              <Input
                id="password"
                type="password"
                {...register('password', { required: true, minLength: 12 })}
              />
            </div>
            {err && <p className="text-sm text-destructive">{err}</p>}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? 'Creating workspace…' : 'Create workspace'}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-foreground hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
