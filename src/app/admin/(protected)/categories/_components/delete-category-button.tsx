"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type DeleteCategoryButtonProps = {
  categoryId: string;
  categoryName: string;
  productCount: number;
};

export function DeleteCategoryButton({ categoryId, categoryName, productCount }: DeleteCategoryButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const disabled = productCount > 0;

  const handleDelete = async () => {
    if (disabled) {
      window.alert('This category cannot be deleted because it still has products.');
      return;
    }

    const confirmed = window.confirm(`Delete ${categoryName}? This action cannot be undone.`);

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/categories/${encodeURIComponent(categoryId)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Unable to delete the category.');
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
      {isDeleting ? 'Deleting...' : disabled ? 'Has products' : 'Delete'}
    </button>
  );
}
