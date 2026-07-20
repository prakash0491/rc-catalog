"use client";

import { ToggleLeft, ToggleRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { OutlineButton } from '@/components/ui';

type ToggleBannerButtonProps = {
  bannerId: string;
  isActive: boolean;
};

export function ToggleBannerButton({ bannerId, isActive }: ToggleBannerButtonProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const nextIsActive = !isActive;

  const handleToggle = async () => {
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/banners/${bannerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextIsActive }),
      });

      if (!response.ok) {
        throw new Error('Unable to update banner status.');
      }

      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <OutlineButton type="button" onClick={handleToggle} disabled={isSaving} className="gap-2">
      {isActive ? <ToggleRight className="h-4 w-4" aria-hidden="true" /> : <ToggleLeft className="h-4 w-4" aria-hidden="true" />}
      {isSaving ? 'Saving...' : isActive ? 'Deactivate' : 'Activate'}
    </OutlineButton>
  );
}
