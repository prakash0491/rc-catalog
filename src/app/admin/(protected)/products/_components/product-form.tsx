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
  mrp: string;
  discountPercent: string;
  sku: string;
  stockQuantity: string;
  lowStockThreshold: string;
  categoryId: string;
  featured: boolean;
  newArrival: boolean;
  bestSeller: boolean;
  status: 'DRAFT' | 'PUBLISHED';
  isActive: boolean;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  metaTitle: string;
  metaDescription: string;
  images: string[];
  thumbnailImage: string;
  specifications: Array<{ name: string; value: string }>;
  variants: Array<{
    optionName: string;
    optionValue: string;
    sku: string;
    priceOverride: string;
    stockQuantity: string;
    isActive: boolean;
  }>;
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
  const [thumbnailImage, setThumbnailImage] = useState(initialValues.thumbnailImage || initialValues.images[0] || '');
  const [specifications, setSpecifications] = useState(initialValues.specifications.length > 0 ? initialValues.specifications : [{ name: '', value: '' }]);
  const [variants, setVariants] = useState(initialValues.variants.length > 0 ? initialValues.variants : [{ optionName: '', optionValue: '', sku: '', priceOverride: '', stockQuantity: '0', isActive: true }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const removeImage = (index: number) => {
    setImages((current) => {
      const nextImages = current.filter((_, currentIndex) => currentIndex !== index);
      if (thumbnailImage === current[index]) {
        setThumbnailImage(nextImages[0] ?? '');
      }
      return nextImages;
    });
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
        if (!thumbnailImage) {
          setThumbnailImage(payload.data.url);
        }
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
      formData.set('thumbnailImage', thumbnailImage);
      formData.delete('specificationNames');
      formData.delete('specificationValues');
      specifications.forEach((specification) => {
        formData.append('specificationNames', specification.name);
        formData.append('specificationValues', specification.value);
      });
      formData.delete('variantOptionNames');
      formData.delete('variantOptionValues');
      formData.delete('variantSkus');
      formData.delete('variantPriceOverrides');
      formData.delete('variantStockQuantities');
      formData.delete('variantActiveStates');
      variants.forEach((variant) => {
        formData.append('variantOptionNames', variant.optionName);
        formData.append('variantOptionValues', variant.optionValue);
        formData.append('variantSkus', variant.sku);
        formData.append('variantPriceOverrides', variant.priceOverride);
        formData.append('variantStockQuantities', variant.stockQuantity);
        formData.append('variantActiveStates', String(variant.isActive));
      });

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
          <span className="text-sm font-medium text-slate-700">MRP</span>
          <Input name="mrp" type="number" step="0.01" min="0" defaultValue={initialValues.mrp} />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Discount (%)</span>
          <Input name="discountPercent" type="number" step="1" min="0" max="100" defaultValue={initialValues.discountPercent} />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">SKU</span>
          <Input name="sku" defaultValue={initialValues.sku} />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Stock quantity</span>
          <Input name="stockQuantity" type="number" step="1" min="0" defaultValue={initialValues.stockQuantity} />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Low stock warning</span>
          <Input name="lowStockThreshold" type="number" step="1" min="0" defaultValue={initialValues.lowStockThreshold} />
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

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Publication</span>
          <Select name="status" defaultValue={initialValues.status} required>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </Select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Meta title</span>
          <Input name="metaTitle" defaultValue={initialValues.metaTitle} maxLength={160} />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-slate-700">Meta description</span>
          <Textarea name="metaDescription" defaultValue={initialValues.metaDescription} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <Checkbox name="featured" defaultChecked={initialValues.featured} />
          <span className="text-sm font-medium text-slate-700">Featured</span>
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <Checkbox name="newArrival" defaultChecked={initialValues.newArrival} />
          <span className="text-sm font-medium text-slate-700">New arrival</span>
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <Checkbox name="bestSeller" defaultChecked={initialValues.bestSeller} />
          <span className="text-sm font-medium text-slate-700">Best seller</span>
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
                    <label className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      <input
                        type="radio"
                        name="thumbnailSelector"
                        checked={thumbnailImage === image}
                        onChange={() => setThumbnailImage(image)}
                      />
                      Thumbnail
                    </label>
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

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Specifications</h2>
            <p className="text-sm text-slate-500">Add dynamic product attributes without changing code.</p>
          </div>
          <button
            type="button"
            onClick={() => setSpecifications((current) => [...current, { name: '', value: '' }])}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Add spec
          </button>
        </div>
        <div className="space-y-3">
          {specifications.map((specification, index) => (
            <div key={index} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <Input
                value={specification.name}
                placeholder="Name, e.g. Material"
                onChange={(event) => setSpecifications((current) => current.map((item, currentIndex) => currentIndex === index ? { ...item, name: event.target.value } : item))}
              />
              <Input
                value={specification.value}
                placeholder="Value, e.g. Aluminum"
                onChange={(event) => setSpecifications((current) => current.map((item, currentIndex) => currentIndex === index ? { ...item, value: event.target.value } : item))}
              />
              <button
                type="button"
                onClick={() => setSpecifications((current) => current.filter((_, currentIndex) => currentIndex !== index))}
                className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Variants</h2>
            <p className="text-sm text-slate-500">Prepare options such as color, size, battery, or model.</p>
          </div>
          <button
            type="button"
            onClick={() => setVariants((current) => [...current, { optionName: '', optionValue: '', sku: '', priceOverride: '', stockQuantity: '0', isActive: true }])}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Add variant
          </button>
        </div>
        <div className="space-y-3">
          {variants.map((variant, index) => (
            <div key={index} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-6">
              <Input value={variant.optionName} placeholder="Option, e.g. Color" onChange={(event) => setVariants((current) => current.map((item, currentIndex) => currentIndex === index ? { ...item, optionName: event.target.value } : item))} />
              <Input value={variant.optionValue} placeholder="Value, e.g. Black" onChange={(event) => setVariants((current) => current.map((item, currentIndex) => currentIndex === index ? { ...item, optionValue: event.target.value } : item))} />
              <Input value={variant.sku} placeholder="Variant SKU" onChange={(event) => setVariants((current) => current.map((item, currentIndex) => currentIndex === index ? { ...item, sku: event.target.value } : item))} />
              <Input value={variant.priceOverride} type="number" step="0.01" min="0" placeholder="Price override" onChange={(event) => setVariants((current) => current.map((item, currentIndex) => currentIndex === index ? { ...item, priceOverride: event.target.value } : item))} />
              <Input value={variant.stockQuantity} type="number" step="1" min="0" placeholder="Stock" onChange={(event) => setVariants((current) => current.map((item, currentIndex) => currentIndex === index ? { ...item, stockQuantity: event.target.value } : item))} />
              <button
                type="button"
                onClick={() => setVariants((current) => current.filter((_, currentIndex) => currentIndex !== index))}
                className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

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
