"use client";

import { GripVertical, Trash2, UploadCloud } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { Alert } from '@/components/ui';
import { Input, Select, Textarea, Checkbox } from '@/components/ui';

type CategoryOption = {
  id: string;
  name: string;
  slug: string;
};

type ProductFormValues = {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: string;
  categoryId: string;
  featured: boolean;
  newArrival: boolean;
  isActive: boolean;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  images: string[];
};

type ProductFormProps = {
  actionUrl: string;
  method: 'POST' | 'PUT';
  submitLabel: string;
  successRedirect: string;
  categories: CategoryOption[];
  initialValues: ProductFormValues;
};

const stockStatusOptions: Array<{ value: ProductFormValues['stockStatus']; label: string }> = [
  { value: 'IN_STOCK', label: 'In stock' },
  { value: 'LOW_STOCK', label: 'Low stock' },
  { value: 'OUT_OF_STOCK', label: 'Out of stock' },
];

type UploadPayload = {
  success?: boolean;
  data?: { url?: string };
  error?: { message?: string };
};

export function ProductForm({ actionUrl, method, submitLabel, successRedirect, categories, initialValues }: ProductFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [images, setImages] = useState<string[]>(initialValues.images);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const removeImage = (index: number) => {
    setImages((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    setImages((current) => {
      const targetIndex = index + direction;

      if (targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const nextImages = [...current];
      const [image] = nextImages.splice(index, 1);
      nextImages.splice(targetIndex, 0, image);
      return nextImages;
    });
  };

  const uploadImage = (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setErrorMessage(null);

    const uploadData = new FormData();
    uploadData.append('image', file);

    const request = new XMLHttpRequest();
    request.open('POST', '/api/admin/products/upload');

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setUploadProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    request.onload = () => {
      try {
        const payload = JSON.parse(request.responseText || '{}') as UploadPayload;

        if (request.status < 200 || request.status >= 300 || !payload.success || !payload.data?.url) {
          throw new Error(payload.error?.message || 'Unable to upload the product image.');
        }

        setImages((current) => [...current, payload.data!.url!]);
        setUploadProgress(100);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Unable to upload the product image.');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    request.onerror = () => {
      setErrorMessage('Unable to upload the product image.');
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    request.send(uploadData);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData(event.currentTarget);
      formData.delete('images');
      images.forEach((image) => formData.append('images', image));

      const response = await fetch(actionUrl, {
        method,
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as { success?: boolean; error?: { message?: string } } | null;

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error?.message || 'Unable to save the product.');
      }

      router.push(successRedirect);
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save the product.');
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
          <span className="text-sm font-medium text-slate-700">Category</span>
          <Select name="categoryId" defaultValue={initialValues.categoryId} required>
            <option value="" disabled>
              Select category
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-slate-700">Short description</span>
          <Textarea name="shortDescription" defaultValue={initialValues.shortDescription} required />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-slate-700">Description</span>
          <Textarea name="description" defaultValue={initialValues.description} required className="min-h-[180px]" />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Price</span>
          <Input name="price" type="number" step="0.01" min="0" defaultValue={initialValues.price} required />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Stock status</span>
          <Select name="stockStatus" defaultValue={initialValues.stockStatus} required>
            {stockStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <Checkbox name="featured" defaultChecked={initialValues.featured} />
          <span className="text-sm font-medium text-slate-700">Featured</span>
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <Checkbox name="newArrival" defaultChecked={initialValues.newArrival} />
          <span className="text-sm font-medium text-slate-700">New arrival</span>
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <Checkbox name="isActive" defaultChecked={initialValues.isActive} />
          <span className="text-sm font-medium text-slate-700">Active</span>
        </label>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Cloudinary images</h2>
            <p className="text-sm text-slate-500">Upload product images in display order.</p>
          </div>
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
            <UploadCloud className="h-4 w-4" aria-hidden="true" />
            {isUploading ? 'Uploading...' : 'Upload image'}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              disabled={isUploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) uploadImage(file);
              }}
            />
          </label>
        </div>

        {uploadProgress !== null && isUploading ? (
          <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Uploading to Cloudinary</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        ) : null}

        {images.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {images.map((image, index) => (
              <div key={`${image}-${index}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="relative h-44 bg-slate-100">
                  <Image src={image} alt={`Product image ${index + 1}`} fill className="object-cover" />
                </div>
                <input type="hidden" name="images" value={image} />
                <div className="space-y-3 p-4">
                  <p className="break-all text-xs text-slate-500">{image}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      <GripVertical className="h-3 w-3" aria-hidden="true" />
                      #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => moveImage(index, -1)}
                      disabled={index === 0}
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImage(index, 1)}
                      disabled={index === images.length - 1}
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Down
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="ml-auto inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
                    >
                      <Trash2 className="h-3 w-3" aria-hidden="true" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
            No product images uploaded yet.
          </div>
        )}
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
