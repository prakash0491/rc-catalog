"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type DeleteProductButtonProps = {
  productId: string;
  productName: string;
};

export function DeleteProductButton({ productId, productName }: DeleteProductButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    const isConfirmed = window.confirm(`Delete ${productName}? This action cannot be undone.`);

    if (!isConfirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/products/${encodeURIComponent(productId)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Unable to delete the product.');
      }

      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isDeleting ? 'Deleting...' : 'Delete'}
    </button>
  );
}
