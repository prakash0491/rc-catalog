"use client";

import { UploadCloud } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

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

type UploadPayload = {
  success?: boolean;
  data?: { url?: string };
  error?: { message?: string };
};

export function CategoryForm({ actionUrl, method, submitLabel, successRedirect, initialValues }: CategoryFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imageUrl, setImageUrl] = useState(initialValues.image);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    setErrorMessage(null);

    try {
      const uploadData = new FormData();
      uploadData.append('image', file);

      const response = await fetch('/api/admin/categories/upload', {
        method: 'POST',
        body: uploadData,
      });

      const payload = (await response.json().catch(() => null)) as UploadPayload | null;

      if (!response.ok || !payload?.success || !payload.data?.url) {
        throw new Error(payload?.error?.message || 'Unable to upload the category image.');
      }

      setImageUrl(payload.data.url);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to upload the category image.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData(event.currentTarget);
      formData.set('image', imageUrl);

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
          <span className="text-xs text-slate-400">Lowercase letters, numbers, and hyphens only.</span>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Display order</span>
          <Input name="displayOrder" type="number" min="0" step="1" defaultValue={initialValues.displayOrder} required />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-slate-700">Description</span>
          <Textarea name="description" defaultValue={initialValues.description} className="min-h-[160px]" />
        </label>
      </div>

      <input type="hidden" name="image" value={imageUrl} />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Category image</h2>
              <p className="text-sm text-slate-500">Upload a square image that represents this category.</p>
            </div>
            <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
              <UploadCloud className="h-4 w-4" aria-hidden="true" />
              {isUploading ? 'Uploading...' : imageUrl ? 'Replace image' : 'Upload image'}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                disabled={isUploading}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleImageUpload(file);
                }}
              />
            </label>
          </div>
          {imageUrl ? <p className="break-all text-xs text-slate-500">{imageUrl}</p> : <p className="text-sm text-slate-500">No image uploaded yet. The storefront will show a placeholder.</p>}
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt="Category image preview"
              width={320}
              height={320}
              className="h-48 w-full object-cover"
              onError={(event) => {
                const img = event.currentTarget;
                if (img.src !== '/images/placeholder.svg') {
                  img.src = '/images/placeholder.svg';
                }
              }}
            />
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-slate-500">Preview</div>
          )}
        </div>
      </div>

      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <Checkbox name="isActive" defaultChecked={initialValues.isActive} />
        <span className="text-sm font-medium text-slate-700">Active</span>
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting || isUploading}
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
