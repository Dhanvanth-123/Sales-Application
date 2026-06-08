import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { APP_NAME, APP_TAGLINE, loginSchema, type LoginInput } from '@caliper/shared';
import { apiErrorMessage, loginRequest } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const HIGHLIGHTS = [
  'Part-level sales, pricing & PVC history',
  'Cycle-time, quality (FAI/FOPA) & PDCA',
  'Tamper-evident audit trail on every change',
  'Management-ready customer & month-wise reports',
];

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuth((s) => s.setSession);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginInput) => {
    setServerError(null);
    try {
      const result = await loginRequest(values);
      setSession(result.accessToken, result.refreshToken, result.user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(apiErrorMessage(err, 'Login failed'));
    }
  };

  return (
    <div className="grid h-full lg:grid-cols-2">
      {/* brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-ink-900 via-ink-800 to-brand-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-brand-400/10 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 text-xl font-bold shadow-glow">
            P
          </div>
          <div>
            <div className="text-lg font-bold">{APP_NAME}</div>
            <div className="text-xs text-slate-300">{APP_TAGLINE}</div>
          </div>
        </div>
        <div className="relative">
          <h1 className="text-3xl font-bold leading-tight">
            The complete part history of your CNC shop, in one place.
          </h1>
          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-center gap-3 text-sm text-slate-200">
                <CheckCircle2 size={18} className="text-brand-300" />
                {h}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative text-xs text-slate-400">
          © {APP_NAME} · Manufacturing intelligence platform
        </div>
      </div>

      {/* form panel */}
      <div className="flex items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="text-2xl font-bold text-brand-700">{APP_NAME}</div>
            <p className="text-sm text-slate-500">{APP_TAGLINE}</p>
          </div>

          <h2 className="text-xl font-semibold text-slate-800">Welcome back</h2>
          <p className="mt-1 text-sm text-slate-500">Sign in to your workspace.</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="admin@caliper.local"
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                {...register('password')}
              />
              {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
            </div>

            {serverError && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-inset ring-red-200">
                {serverError}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-6 rounded-lg bg-white px-3 py-2.5 text-center text-xs text-slate-500 ring-1 ring-inset ring-slate-200">
            Demo · admin@caliper.local · Caliper@123
          </p>
        </div>
      </div>
    </div>
  );
}
