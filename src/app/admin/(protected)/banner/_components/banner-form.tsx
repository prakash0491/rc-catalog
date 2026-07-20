"use client";

import { UploadCloud } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { Alert, Checkbox, Input, Textarea } from '@/components/ui';

type BannerFormValues = {
  title: string;
  subtitle: string;
  image: string;
  buttonText: string;
  buttonUrl: string;
  priority: string;
  isActive: boolean;
};

type BannerFormProps = {
  actionUrl: string;
  method: 'POST' | 'PUT';
  submitLabel: string;
  successRedirect: string;
  initialValues: BannerFormValues;
};

type UploadPayload = {
  success?: boolean;
  data?: { url?: string };
  error?: { message?: string };
};

export function BannerForm({ actionUrl, method, submitLabel, successRedirect, initialValues }: BannerFormProps) {
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

      const response = await fetch('/api/admin/banners/upload', {
        method: 'POST',
        body: uploadData,
      });

      const payload = (await response.json().catch(() => null)) as UploadPayload | null;

      if (!response.ok || !payload?.success || !payload.data?.url) {
        throw new Error(payload?.error?.message || 'Unable to upload the banner image.');
      }

      setImageUrl(payload.data.url);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to upload the banner image.');
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
      if (!imageUrl) {
        throw new Error('Upload a banner image before saving.');
      }

      const formData = new FormData(event.currentTarget);
      formData.set('image', imageUrl);

      const response = await fetch(actionUrl, {
        method,
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as { success?: boolean; error?: { message?: string } } | null;

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error?.message || 'Unable to save the banner.');
      }

      router.push(successRedirect);
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save the banner.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 rounded-[2rem] border border-white/10 bg-white p-6 text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.12)] sm:p-8">
      {errorMessage ? <Alert tone="error">{errorMessage}</Alert> : null}

      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-slate-700">Title</span>
          <Input name="title" defaultValue={initialValues.title} maxLength={160} required />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-slate-700">Subtitle</span>
          <Textarea name="subtitle" defaultValue={initialValues.subtitle} className="min-h-[130px]" />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Button text</span>
          <Input name="buttonText" defaultValue={initialValues.buttonText} maxLength={80} placeholder="Explore products" />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Button URL</span>
          <Input name="buttonUrl" defaultValue={initialValues.buttonUrl} placeholder="/products" />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Priority</span>
          <Input name="priority" type="number" min="0" step="1" defaultValue={initialValues.priority} required />
        </label>

        <label className="flex items-center gap-3 self-end rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <Checkbox name="isActive" defaultChecked={initialValues.isActive} />
          <span className="text-sm font-medium text-slate-700">Active</span>
        </label>
      </div>

      <input type="hidden" name="image" value={imageUrl} />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Cloudinary image</h2>
              <p className="text-sm text-slate-500">Upload the permanent homepage banner asset.</p>
            </div>
            <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
              <UploadCloud className="h-4 w-4" aria-hidden="true" />
              {isUploading ? 'Uploading...' : 'Upload'}
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
          {imageUrl ? <p className="break-all text-xs text-slate-500">{imageUrl}</p> : <p className="text-sm text-slate-500">No image uploaded yet.</p>}
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
          {imageUrl ? (
            <Image src={imageUrl} alt="Banner preview" width={640} height={384} className="h-48 w-full object-cover" />
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-slate-500">Preview</div>
          )}
        </div>
      </div>

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
