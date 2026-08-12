'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { Input, PrimaryButton } from '@/components/ui';

type Suggestion = {
  label: string;
  href: string;
  type: 'Product' | 'Category';
};

type DiscoverySearchProps = {
  basePath: string;
  initialSearch?: string;
  suggestions: Suggestion[];
};

export function DiscoverySearch({ basePath, initialSearch = '', suggestions }: DiscoverySearchProps) {
  const [query, setQuery] = useState(initialSearch);
  const [debouncedQuery, setDebouncedQuery] = useState(initialSearch);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 220);
    return () => window.clearTimeout(timer);
  }, [query]);

  const visibleSuggestions = useMemo(() => {
    if (debouncedQuery.length < 2) {
      return [];
    }

    const value = debouncedQuery.toLowerCase();
    return suggestions
      .filter((item) => item.label.toLowerCase().includes(value))
      .slice(0, 6);
  }, [debouncedQuery, suggestions]);

  return (
    <div className="relative">
      <div className="flex gap-2">
        <Input
          name="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search products, categories, brands"
          autoComplete="off"
          className="rounded-full py-3 pl-5"
        />
        <PrimaryButton type="submit">Search</PrimaryButton>
      </div>

      {visibleSuggestions.length > 0 ? (
        <div className="absolute left-0 right-0 top-full z-20 mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
          {visibleSuggestions.map((item) => (
            <Link key={`${item.type}-${item.href}`} href={item.href} className="flex items-center justify-between px-5 py-3 text-sm transition hover:bg-slate-50">
              <span className="font-semibold text-slate-950">{item.label}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">{item.type}</span>
            </Link>
          ))}
          <Link href={`${basePath}?search=${encodeURIComponent(debouncedQuery)}`} className="block border-t border-slate-100 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-50">
            View all results for &ldquo;{debouncedQuery}&rdquo;
          </Link>
        </div>
      ) : null}
    </div>
  );
}
