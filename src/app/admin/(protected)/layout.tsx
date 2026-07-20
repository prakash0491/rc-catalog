import Link from 'next/link';
import { redirect } from 'next/navigation';

import { ADMIN_HOME_PATH, ADMIN_LOGIN_PATH, getAdminSessionFromCookieStore } from '@/lib/auth/server';

const navigationItems = [
  { href: ADMIN_HOME_PATH, label: 'Overview' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/banner', label: 'Banner' },
  { href: '/admin/offers', label: 'Offers' },
];

export default async function AdminProtectedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getAdminSessionFromCookieStore();

  if (!session) {
    redirect(ADMIN_LOGIN_PATH);
  }

  const initials = (session.name ?? session.email)
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-white/10 bg-slate-950/90 px-6 py-8 backdrop-blur">
          <div className="space-y-6">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-sm font-semibold text-slate-950">
                  {initials || 'A'}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Admin panel</p>
                  <p className="text-xs text-slate-400">{session.email}</p>
                </div>
              </div>
            </div>

            <nav className="space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center rounded-2xl border border-transparent px-4 py-3 text-sm font-medium text-slate-300 transition hover:border-white/10 hover:bg-white/5 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        <div className="flex min-h-screen flex-col">
          <header className="border-b border-white/10 bg-slate-950/70 px-6 py-5 backdrop-blur">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Protected admin area</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Catalog management</h1>
              </div>

              <form action="/admin/api/logout" method="post">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Logout
                </button>
              </form>
            </div>
          </header>

          <main className="flex-1 p-6 sm:p-8 lg:p-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
