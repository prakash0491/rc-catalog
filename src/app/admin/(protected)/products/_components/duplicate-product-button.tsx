"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type DuplicateProductButtonProps = {
  productId: string;
};

export function DuplicateProductButton({ productId }: DuplicateProductButtonProps) {
  const router = useRouter();
  const [isDuplicating, setIsDuplicating] = useState(false);

  const handleDuplicate = async () => {
    setIsDuplicating(true);

    try {
      const response = await fetch(`/api/admin/products/${encodeURIComponent(productId)}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Unable to duplicate the product.');
      }

      router.refresh();
    } finally {
      setIsDuplicating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDuplicate}
      disabled={isDuplicating}
      className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isDuplicating ? 'Duplicating...' : 'Duplicate'}
    </button>
  );
}
