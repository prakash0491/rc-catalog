'use client';

import { useState } from 'react';
import { Check, Share2 } from 'lucide-react';

import { SecondaryButton } from '@/components/ui';
import { cn } from '@/lib/utils';

type ShareButtonProps = {
  productName: string;
  className?: string;
};

export function ShareButton({ productName, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copyToClipboard(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable; leave the state unchanged.
    }
  }

  async function handleShare() {
    const url = window.location.href;

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: productName, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
      }
    }

    await copyToClipboard(url);
  }

  return (
    <SecondaryButton type="button" onClick={handleShare} className={cn('gap-2', className)}>
      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
      {copied ? 'Link copied' : 'Share'}
    </SecondaryButton>
  );
}
