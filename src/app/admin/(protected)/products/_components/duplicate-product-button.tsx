"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type DuplicateProductButtonProps = {
  productId: string;
};

export function DuplicateProductButton({ productId }: DuplicateProductButtonProps) {
  const router = useRouter();
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/admin/products/${encodeURIComponent(productId)}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error?.message || 'Unable to duplicate the product.');
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to duplicate the product.');
    } finally {
      setIsDuplicating(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDuplicate}
        disabled={isDuplicating}
        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isDuplicating ? 'Duplicating...' : 'Duplicate'}
      </button>
      {errorMessage ? <span role="alert" className="text-xs text-rose-700">{errorMessage}</span> : null}
    </div>
  );
}
