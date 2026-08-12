"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Checkbox, Input, Textarea } from '@/components/ui';

export function OfferCreateForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/offers', {
        method: 'POST',
        body: new FormData(event.currentTarget),
      });

      if (!response.ok) {
        throw new Error('Unable to create offer.');
      }

      event.currentTarget.reset();
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <Input name="title" placeholder="Offer title" required />
        <Input name="priority" type="number" min="0" defaultValue="0" placeholder="Priority" />
        <Textarea name="description" placeholder="Description" className="md:col-span-2" />
        <Input name="image" placeholder="Optional image URL" className="md:col-span-2" />
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <Checkbox name="isActive" defaultChecked />
          Active
        </label>
      </div>
      <button type="submit" disabled={isSubmitting} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
        {isSubmitting ? 'Saving...' : 'Create offer'}
      </button>
    </form>
  );
}

export function DeleteOfferButton({ offerId }: { offerId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Delete this offer?')) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/offers/${offerId}`, { method: 'DELETE' });

      if (!response.ok) {
        throw new Error('Unable to delete offer.');
      }

      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button type="button" disabled={isDeleting} onClick={handleDelete} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50">
      {isDeleting ? 'Deleting...' : 'Delete'}
    </button>
  );
}
