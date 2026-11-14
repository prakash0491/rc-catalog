'use client';

import { useEffect } from 'react';
import Link from 'next/link';

import { ResponsiveContainer, SectionContainer } from '@/components/common';
import { EmptyState, PrimaryButton, SecondaryButton } from '@/components/ui';

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <SectionContainer spacing="md">
      <ResponsiveContainer>
        <EmptyState
          title="Something went wrong"
          description="We could not load this page right now. Please try again, or head back to the catalog."
          className="rounded-[2rem]"
        >
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <PrimaryButton type="button" onClick={reset}>Try again</PrimaryButton>
            <Link href="/products">
              <SecondaryButton type="button">Browse products</SecondaryButton>
            </Link>
          </div>
        </EmptyState>
      </ResponsiveContainer>
    </SectionContainer>
  );
}
