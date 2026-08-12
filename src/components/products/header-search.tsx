'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { SearchInput } from '@/components/ui';

type Suggestion = {
  id: string;
  label: string;
  href: string;
  type: 'product' | 'category';
  image?: string | null;
  meta?: string;
};

type HeaderSearchProps = {
  className?: string;
};

export function HeaderSearch({ className }: HeaderSearchProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 220);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`/api/products/suggestions?q=${encodeURIComponent(debouncedQuery)}`)
      .then((response) => response.json())
      .then((payload) => {
        if (!cancelled && payload?.success) {
          setSuggestions(payload.data.suggestions ?? []);
          setOpen(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSuggestions([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOpen(false);

    const value = query.trim();
    router.push(value ? `/products?search=${encodeURIComponent(value)}` : '/products');
  }

  const showDropdown = open && (loading || suggestions.length > 0);

  return (
    <div ref={containerRef} className={className}>
      <form action="/products" role="search" onSubmit={handleSubmit} className="relative">
        <SearchInput
          name="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setOpen(false);
            }
          }}
          aria-label="Search products"
          placeholder="Search products"
          autoComplete="off"
        />
      </form>

      {showDropdown ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
          {loading ? (
            <div className="px-5 py-4 text-sm text-slate-500">Searching&hellip;</div>
          ) : (
            <>
              {suggestions.slice(0, 6).map((item) => (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50"
                >
                  {item.image ? (
                    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      <Image src={item.image} alt="" fill sizes="40px" className="object-cover" />
                    </span>
                  ) : (
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-black text-slate-400">
                      Q
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-950">{item.label}</span>
                    {item.meta ? <span className="block truncate text-xs text-slate-500">{item.meta}</span> : null}
                  </span>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    {item.type}
                  </span>
                </Link>
              ))}

              {debouncedQuery.length >= 2 ? (
                <Link
                  href={`/products?search=${encodeURIComponent(debouncedQuery)}`}
                  onClick={() => setOpen(false)}
                  className="block border-t border-slate-100 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-50"
                >
                  View all results for &ldquo;{debouncedQuery}&rdquo;
                </Link>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
