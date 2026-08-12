import Link from 'next/link';
import { cookies } from 'next/headers';
import { Heart, ShoppingCart, User } from 'lucide-react';

import { HeaderSearch } from '@/components/products/header-search';
import { Container, IconButton, Stack } from '@/components/ui';
import { CUSTOMER_AUTH_COOKIE, GUEST_CART_COOKIE } from '@/lib/auth/customer-constants';
import { verifyCustomerSession } from '@/lib/auth/customer-jwt';
import { getCartItemCount } from '@/lib/cart';
import { getPublicContent } from '@/lib/public-content';
import { getWishlistCount } from '@/lib/wishlist';

const navItems = [
  { label: 'Shop', href: '/products' },
  { label: 'RC Cars', href: '/categories' },
  { label: 'Categories', href: '/categories' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export async function Navbar() {
  const { businessProfile } = await getPublicContent();

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(CUSTOMER_AUTH_COOKIE)?.value;
  const customer = sessionToken ? await verifyCustomerSession(sessionToken) : null;

  const guestSessionId = cookieStore.get(GUEST_CART_COOKIE)?.value ?? null;

  const [cartCount, wishlistCount] = await Promise.all([
    getCartItemCount(customer, guestSessionId),
    customer ? getWishlistCount(customer.id) : Promise.resolve(0),
  ]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl">
      <div className="hidden bg-slate-950 text-white md:block">
        <Container className="flex items-center justify-between py-2 text-[11px] font-semibold uppercase tracking-[0.14em]">
          <span>Need assistance?</span>
          <div className="flex items-center gap-5">
            <a href={`tel:${businessProfile.phone}`} className="transition hover:text-white/70">
              {businessProfile.phone}
            </a>
            <span className="h-3 w-px bg-white/25" />
            <a href={`mailto:${businessProfile.email}`} className="transition hover:text-white/70">
              {businessProfile.email}
            </a>
          </div>
        </Container>
      </div>

      <Container className="flex items-center justify-between gap-4 py-3">
        <Link href="/" className="group flex items-center gap-3 text-slate-950" aria-label={`${businessProfile.name} home`}>
          <span className="grid h-11 w-11 place-items-center rounded-full border-2 border-slate-950 text-xl font-black transition group-hover:rotate-6">
            Q
          </span>
          <span className="leading-none">
            <span className="block text-sm font-black uppercase tracking-tight">{businessProfile.name}</span>
            <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Store</span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
          <Link href="/products?sort=featured" className="relative rounded-full border border-red-200 bg-red-50 px-5 py-2 text-sm font-bold text-red-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-red-100">
            <span className="absolute -top-2 left-3 rounded-full bg-red-600 px-1.5 py-0.5 text-[9px] uppercase text-white">Daily</span>
            Deals
          </Link>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-semibold text-slate-600 transition hover:text-slate-950">
              {item.label}
            </Link>
          ))}
        </nav>

        <Stack direction="row" gap="sm" className="items-center">
          <HeaderSearch className="hidden w-64 lg:block" />
          <Link href="/products" className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950" aria-label="Search catalog">
            S
          </Link>

          {customer ? (
            <>
              <Link href="/wishlist" className="relative">
                <IconButton icon={<Heart className="h-4 w-4" />} label="Wishlist" />
                {wishlistCount > 0 ? (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                    {wishlistCount}
                  </span>
                ) : null}
              </Link>
              <Link href="/cart" className="relative">
                <IconButton icon={<ShoppingCart className="h-4 w-4" />} label="Cart" />
                {cartCount > 0 ? (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-slate-950 px-1 text-[10px] font-bold text-white">
                    {cartCount}
                  </span>
                ) : null}
              </Link>
              <Link href="/account" className="relative">
                <IconButton icon={<User className="h-4 w-4" />} label="Account" />
              </Link>
            </>
          ) : (
            <>
              <Link href="/cart" className="relative">
                <IconButton icon={<ShoppingCart className="h-4 w-4" />} label="Cart" />
                {cartCount > 0 ? (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-slate-950 px-1 text-[10px] font-bold text-white">
                    {cartCount}
                  </span>
                ) : null}
              </Link>
              <Link href="/login" className="text-sm font-semibold text-slate-600 transition hover:text-slate-950">
                Sign in
              </Link>
            </>
          )}

          <Link href="/contact" className="hidden rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800 sm:inline-flex">
            Inquire
          </Link>
        </Stack>
      </Container>
    </header>
  );
}