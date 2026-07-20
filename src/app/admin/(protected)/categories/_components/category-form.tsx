"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Alert, Checkbox, Input, Textarea } from '@/components/ui';

type CategoryFormValues = {
  name: string;
  slug: string;
  description: string;
  image: string;
  displayOrder: string;
  isActive: boolean;
};

type CategoryFormProps = {
  actionUrl: string;
  method: 'POST' | 'PUT';
  submitLabel: string;
  successRedirect: string;
  initialValues: CategoryFormValues;
};

export function CategoryForm({ actionUrl, method, submitLabel, successRedirect, initialValues }: CategoryFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData(event.currentTarget);

      const response = await fetch(actionUrl, {
        method,
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as { success?: boolean; error?: { message?: string } } | null;

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error?.message || 'Unable to save the category.');
      }

      router.push(successRedirect);
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save the category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 rounded-[2rem] border border-white/10 bg-white p-6 text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.12)] sm:p-8">
      {errorMessage ? <Alert tone="error">{errorMessage}</Alert> : null}

      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-slate-700">Name</span>
          <Input name="name" defaultValue={initialValues.name} required />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Slug</span>
          <Input name="slug" defaultValue={initialValues.slug} placeholder="Generated automatically if empty" />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Display order</span>
          <Input name="displayOrder" type="number" min="0" step="1" defaultValue={initialValues.displayOrder} required />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-slate-700">Description</span>
          <Textarea name="description" defaultValue={initialValues.description} className="min-h-[160px]" />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-slate-700">Image URL</span>
          <Input name="image" defaultValue={initialValues.image} placeholder="https://example.com/category.jpg" />
        </label>
      </div>

      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <Checkbox name="isActive" defaultChecked={initialValues.isActive} />
        <span className="text-sm font-medium text-slate-700">Active</span>
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>

        <button
          type="button"
          onClick={() => router.push(successRedirect)}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
