"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type BulkProductActionsProps = {
  products: Array<{ id: string; name: string }>;
};

type BulkAction = 'publish' | 'draft' | 'delete';

export function BulkProductActions({ products }: BulkProductActionsProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleAll = () => {
    setSelectedIds((current) => current.length === products.length ? [] : products.map((product) => product.id));
  };

  const toggleProduct = (id: string) => {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const runAction = async (action: BulkAction) => {
    if (selectedIds.length === 0) {
      return;
    }

    if (action === 'delete' && !window.confirm(`Archive ${selectedIds.length} selected products?`)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, ids: selectedIds }),
      });

      if (!response.ok) {
        throw new Error('Unable to update products.');
      }

      setSelectedIds([]);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={toggleAll}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            {selectedIds.length === products.length ? 'Clear selection' : 'Select visible'}
          </button>
          <span className="text-sm text-slate-500">{selectedIds.length} selected</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={isSubmitting || selectedIds.length === 0} onClick={() => runAction('publish')} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50">
            Publish
          </button>
          <button type="button" disabled={isSubmitting || selectedIds.length === 0} onClick={() => runAction('draft')} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">
            Move to draft
          </button>
          <button type="button" disabled={isSubmitting || selectedIds.length === 0} onClick={() => runAction('delete')} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50">
            Archive
          </button>
        </div>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <label key={product.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
            <input type="checkbox" checked={selectedIds.includes(product.id)} onChange={() => toggleProduct(product.id)} />
            {product.name}
          </label>
        ))}
      </div>
    </div>
  );
}
