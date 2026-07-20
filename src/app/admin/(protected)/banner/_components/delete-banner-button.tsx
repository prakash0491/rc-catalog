"use client";

import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { OutlineButton } from '@/components/ui';

type DeleteBannerButtonProps = {
  bannerId: string;
  bannerTitle: string;
};

export function DeleteBannerButton({ bannerId, bannerTitle }: DeleteBannerButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm(`Delete "${bannerTitle}"? This cannot be undone.`);

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/banners/${bannerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Unable to delete banner.');
      }

      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <OutlineButton type="button" onClick={handleDelete} disabled={isDeleting} className="gap-2 border-rose-200 text-rose-700 hover:bg-rose-50">
      <Trash2 className="h-4 w-4" aria-hidden="true" />
      {isDeleting ? 'Deleting...' : 'Delete'}
    </OutlineButton>
  );
}
