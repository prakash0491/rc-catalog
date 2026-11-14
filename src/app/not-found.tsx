import Link from 'next/link';

import { ResponsiveContainer, SectionContainer } from '@/components/common';
import { EmptyState, PrimaryButton, SecondaryButton } from '@/components/ui';

export default function NotFoundPage() {
  return (
    <SectionContainer spacing="md">
      <ResponsiveContainer>
        <EmptyState
          title="Page not found"
          description="The page you are looking for may have moved or no longer exists."
          className="rounded-[2rem]"
        >
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link href="/">
              <PrimaryButton type="button">Go home</PrimaryButton>
            </Link>
            <Link href="/products">
              <SecondaryButton type="button">Browse products</SecondaryButton>
            </Link>
          </div>
        </EmptyState>
      </ResponsiveContainer>
    </SectionContainer>
  );
}
