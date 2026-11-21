import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, ArrowRight, ArrowUpRight } from 'lucide-react';
import { GarageFinder } from '@/components/home/garage-finder';
import { getPublicContent } from '@/lib/public-content';
import { listPublicProducts } from '@/lib/products';
import { formatPrice } from '@/lib/money';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function loadBrands() {
  try {
    return await prisma.productSpecification.findMany({
      where: {
        name: { equals: 'brand', mode: 'insensitive' },
        product: { isActive: true, deletedAt: null, status: 'PUBLISHED', category: { isActive: true } },
      },
      distinct: ['value'], select: { value: true }, orderBy: { value: 'asc' },
    });
  } catch { return []; }
}

export default async function HomePage() {
  const [content, cars, brands] = await Promise.all([
    getPublicContent(),
    listPublicProducts({ category: 'rc-cars', sort: 'newest', page: 1, limit: 4 }).catch(() => null),
    loadBrands(),
  ]);
  const categories = content.categories.map(category => category.slug);
  const hasFinder = categories.some(slug => ['rc-cars','rc-trucks-buggies','rc-planes-drones','rc-motorcycles'].includes(slug));

  return (
    <div className="garage-home">
      <section className="garage-hero">
        <Image priority fill sizes="100vw" src="/images/garage-campaign.webp" alt="Orange radio-controlled buggy kicking up gravel at dusk" className="garage-campaign" />
        <div className="garage-shade" />
        <div className="garage-hero-copy">
          <p className="garage-kicker"><span /> Remote control / VISH GARAGE</p>
          <h1>Small scale.<br /><em>Full throttle.</em></h1>
          <p className="garage-intro">Discover remote-control cars, dirt-ready buggies and trucks built for your next run.</p>
          <div className="garage-hero-links">
            <Link className="garage-primary" href="/products">Shop the garage <ArrowUpRight size={18} /></Link>
            {hasFinder && <a className="garage-secondary" href="#ride-finder">Find my ride <ArrowDown size={17} /></a>}
          </div>
        </div>
      </section>
      <div className="garage-content">
        <GarageFinder available={categories} />
        {!!cars?.items.length && <section className="garage-lineup">
          <div className="garage-section-head"><div><p className="garage-kicker">The showroom</p><h2>Latest RC cars</h2></div><Link href="/categories/rc-cars">View all cars <ArrowRight size={16} /></Link></div>
          <div className="garage-products">{cars.items.map(car => <Link key={car.id} href={'/products/' + car.slug} className="garage-product">
            <div><Image fill sizes="(max-width: 600px) 45vw, 24vw" src={car.images[0] || '/images/placeholder.svg'} alt={car.name} /></div>
            <h3>{car.name}</h3><p>{formatPrice(car.price)} <ArrowUpRight size={16} /></p>
          </Link>)}</div>
        </section>}
        <section className="garage-collections"><div className="garage-section-head"><h2>Collections</h2><Link href="/categories">View all <ArrowRight size={16} /></Link></div>
          <div className="garage-tags">{content.categories.map(category => <Link key={category.id} href={'/categories/' + category.slug}>{category.name} <ArrowUpRight size={14} /></Link>)}</div>
          {!!brands.length && <><h3>Shop by brand</h3><div className="garage-tags">{brands.map(({value}) => <Link key={value} href={'/products?brand=' + encodeURIComponent(value)}>{value}</Link>)}</div></>}
        </section>
      </div>
    </div>
  );
}
