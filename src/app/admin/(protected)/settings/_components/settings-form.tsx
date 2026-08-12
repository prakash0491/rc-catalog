"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Alert, Input, Textarea } from '@/components/ui';

type SettingsFormValues = {
  businessName: string;
  logo: string;
  phone: string;
  email: string;
  whatsapp: string;
  instagram: string;
  facebook: string;
  youtube: string;
  address: string;
  businessHours: string;
  seoTitle: string;
  seoDescription: string;
};

export function SettingsForm({ initialValues }: { initialValues: SettingsFormValues }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        body: new FormData(event.currentTarget),
      });

      if (!response.ok) {
        throw new Error('Unable to save settings.');
      }

      setMessage('Settings saved.');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save settings.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      {message ? <Alert tone={message === 'Settings saved.' ? 'success' : 'error'}>{message}</Alert> : null}

      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-slate-700">Business name</span>
          <Input name="businessName" defaultValue={initialValues.businessName} required />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Logo URL</span>
          <Input name="logo" defaultValue={initialValues.logo} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <Input name="email" type="email" defaultValue={initialValues.email} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Phone</span>
          <Input name="phone" defaultValue={initialValues.phone} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">WhatsApp</span>
          <Input name="whatsapp" defaultValue={initialValues.whatsapp} />
        </label>
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-slate-700">Address</span>
          <Textarea name="address" defaultValue={initialValues.address} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Business hours</span>
          <Input name="businessHours" defaultValue={initialValues.businessHours} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Instagram</span>
          <Input name="instagram" defaultValue={initialValues.instagram} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Facebook</span>
          <Input name="facebook" defaultValue={initialValues.facebook} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">YouTube</span>
          <Input name="youtube" defaultValue={initialValues.youtube} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">SEO title</span>
          <Input name="seoTitle" defaultValue={initialValues.seoTitle} maxLength={160} />
        </label>
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-slate-700">SEO description</span>
          <Textarea name="seoDescription" defaultValue={initialValues.seoDescription} />
        </label>
      </div>

      <button type="submit" disabled={isSubmitting} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
        {isSubmitting ? 'Saving...' : 'Save settings'}
      </button>
    </form>
  );
}
