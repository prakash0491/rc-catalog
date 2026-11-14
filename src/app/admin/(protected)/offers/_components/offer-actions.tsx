"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Checkbox, Input, Textarea, Alert } from '@/components/ui';

export function OfferCreateForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/admin/offers', {
        method: 'POST',
        body: new FormData(event.currentTarget),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error?.message || 'Unable to create offer.');
      }

      event.currentTarget.reset();
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to create offer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      {errorMessage ? <Alert tone="error">{errorMessage}</Alert> : null}
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!window.confirm('Delete this offer?')) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/admin/offers/${offerId}`, { method: 'DELETE' });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error?.message || 'Unable to delete offer.');
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to delete offer.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button type="button" disabled={isDeleting} onClick={handleDelete} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50">
        {isDeleting ? 'Deleting...' : 'Delete'}
      </button>
      {errorMessage ? <span role="alert" className="text-xs text-rose-700">{errorMessage}</span> : null}
    </div>
  );
}
