"use client";

import type { InquiryStatus } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type InquiryStatusButtonProps = {
  inquiryId: string;
  status: InquiryStatus;
  label: string;
};

export function InquiryStatusButton({ inquiryId, status, label }: InquiryStatusButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateStatus = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/inquiries/${encodeURIComponent(inquiryId)}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Unable to update inquiry.');
      }

      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button
      type="button"
      disabled={isSubmitting}
      onClick={updateStatus}
      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
    >
      {isSubmitting ? 'Updating...' : label}
    </button>
  );
}
