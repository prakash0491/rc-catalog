'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { Input, PrimaryButton, Text } from '@/components/ui';
import { getSafeCustomerRedirectPath } from '@/lib/safe-url';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = getSafeCustomerRedirectPath(searchParams.get('next'));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error?.message ?? 'Invalid email or password.');
        return;
      }

      router.push(next);
      router.refresh();
    } catch {
      setError('Unable to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
          <Text variant="muted" className="mt-2">Sign in to your account to manage your wishlist and cart.</Text>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
              autoComplete="current-password"
            />
          </label>

          <PrimaryButton type="submit" loading={loading} className="w-full">
            Sign in
          </PrimaryButton>

          <p className="text-center text-sm text-slate-500">
            Don&rsquo;t have an account?{' '}
            <Link href={`/register?next=${encodeURIComponent(next)}`} className="font-semibold text-slate-950 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-950">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12">
        <div className="h-48 w-full max-w-md animate-pulse rounded-[2rem] bg-slate-200" />
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}
