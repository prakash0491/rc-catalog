import { redirect } from 'next/navigation';
import Link from 'next/link';

import { ADMIN_HOME_PATH, getAdminSessionFromCookieStore, getSafeAdminRedirectPath } from '@/lib/auth/server';

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    next?: string;
  }>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const session = await getAdminSessionFromCookieStore();
  const resolvedSearchParams = await searchParams;

  if (session) {
    redirect(ADMIN_HOME_PATH);
  }

  const nextPath = getSafeAdminRedirectPath(resolvedSearchParams?.next ?? null);
  const hasError = resolvedSearchParams?.error === 'invalid';

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.24),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(15,23,42,0.9),_transparent_30%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/8 shadow-[0_32px_120px_rgba(15,23,42,0.35)] backdrop-blur-md lg:grid-cols-[1.05fr_0.95fr]">
          <section className="border-b border-white/10 bg-slate-950/70 p-8 sm:p-10 lg:border-b-0 lg:border-r lg:p-12">
            <span className="inline-flex w-fit rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">
              Admin access
            </span>
            <div className="mt-6 space-y-4">
              <h1 className="max-w-md text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Sign in to the catalog admin panel.
              </h1>
              <p className="max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                Use your admin credentials to manage the catalog experience. Public pages stay untouched, and protected routes remain locked until you authenticate.
              </p>
            </div>
            <div className="mt-10 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="font-medium text-white">JWT session</div>
                <div className="mt-1 leading-6">HttpOnly cookie-based auth</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="font-medium text-white">Bcrypt</div>
                <div className="mt-1 leading-6">Password hashing and verification</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="font-medium text-white">Protected routes</div>
                <div className="mt-1 leading-6">Middleware guards every admin page</div>
              </div>
            </div>
          </section>

          <section className="p-8 sm:p-10 lg:p-12">
            <div className="mx-auto max-w-md">
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 text-slate-900 shadow-[0_20px_60px_rgba(15,23,42,0.12)] sm:p-8">
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold tracking-tight">Admin login</h2>
                  <p className="text-sm leading-6 text-slate-500">Enter the email and password for a configured admin account.</p>
                </div>

                {hasError ? (
                  <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    Invalid email or password.
                  </div>
                ) : null}

                <form action="/admin/api/login" method="post" className="mt-6 space-y-5">
                  <input type="hidden" name="next" value={nextPath} />

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">Email</span>
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      required
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900"
                      placeholder="admin@example.com"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">Password</span>
                    <input
                      type="password"
                      name="password"
                      autoComplete="current-password"
                      required
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900"
                      placeholder="••••••••"
                    />
                  </label>

                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Sign in
                  </button>
                </form>

                <p className="mt-5 text-xs leading-5 text-slate-500">
                  Protected areas include products, categories, banners, and offers.{' '}
                  <Link href={ADMIN_HOME_PATH} className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-4">
                    Back to admin home
                  </Link>
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
