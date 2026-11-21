import Link from 'next/link';
import { cookies } from 'next/headers';
import { Menu, Search, ShoppingBag } from 'lucide-react';

import { HeaderSearch } from '@/components/products/header-search';
import { GUEST_CART_COOKIE } from '@/lib/auth/customer-constants';
import { getCartItemCount } from '@/lib/cart';
import { getPublicContent } from '@/lib/public-content';

const links = [
  { label: 'Shop all', href: '/products' },
  { label: 'Collections', href: '/categories' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export async function Navbar() {
  const { businessProfile } = await getPublicContent();
  const session = (await cookies()).get(GUEST_CART_COOKIE)?.value ?? null;
  const count = await getCartItemCount(null, session);
  return (
    <header className="garage-nav">
      <Link href="/" className="garage-wordmark" aria-label={businessProfile.name + ' home'}>
        <span className="garage-mark" aria-hidden="true">VG</span>
        {businessProfile.name}
      </Link>
      <nav className="garage-desktop-links" aria-label="Primary">
        {links.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}
      </nav>
      <div className="garage-actions">
        <HeaderSearch className="relative hidden w-48 text-slate-900 xl:block" />
        <Link href="/products" aria-label="Search catalog" className="xl:hidden"><Search size={20} /></Link>
        <Link href="/cart" className="garage-cart" aria-label={'Shopping cart, ' + count + ' items'}><ShoppingBag size={19} /><span>{count}</span></Link>
        <details className="garage-menu">
          <summary aria-label="Store navigation"><Menu size={22} /></summary>
          <nav aria-label="Mobile navigation">{links.map(link => <a key={link.href} href={link.href}>{link.label}</a>)}</nav>
        </details>
      </div>
    </header>
  );
}
