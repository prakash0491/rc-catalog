import Link from 'next/link';
import { CategoriesSection } from '@/components/home/categories-section';
import { FeaturedProductsSection } from '@/components/home/featured-products-section';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
export default async function HomePage() {
  const brands = await prisma.productSpecification.findMany({ where: { name: { equals: 'brand', mode: 'insensitive' }, product: { isActive: true, deletedAt: null, status: 'PUBLISHED' } }, distinct: ['value'], select: { value: true }, orderBy: { value: 'asc' } });
  return <><header className="bg-slate-950 px-6 py-16 text-center text-white"><h1 className="text-4xl font-bold">RC Catalog</h1><Link href="/products" className="mt-6 inline-block rounded-full bg-white px-6 py-3 text-slate-950">Shop all products</Link></header>
    <CategoriesSection />{brands.length > 0 && <section className="mx-auto max-w-6xl px-6 py-10"><h2 className="mb-4 text-2xl font-bold">Shop by brand</h2><div className="flex flex-wrap gap-3">{brands.map(({ value }) => <Link key={value} className="rounded-full border px-4 py-2" href={'/products?brand=' + encodeURIComponent(value)}>{value}</Link>)}</div></section>}<FeaturedProductsSection /></>;
}
