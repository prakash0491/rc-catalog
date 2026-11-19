import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

import { ResponsiveContainer, SectionContainer } from '@/components/common';
import { CheckoutButton } from '@/components/checkout/checkout-button';
import { BaseCard, EmptyState, Heading, PrimaryButton, Text } from '@/components/ui';
import { getGuestSessionId } from '@/lib/guest-session';
import { formatPrice } from '@/lib/money';
import { loadCheckoutCart } from '@/lib/orders';
import { getPublicContent } from '@/lib/public-content';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const session = await getGuestSessionId();

  if (!session) {
    redirect('/cart');
  }

  const [cart, publicContent] = await Promise.all([loadCheckoutCart(session), getPublicContent()]);

  if (!cart || cart.items.length === 0) {
    return (
      <SectionContainer spacing="md">
        <ResponsiveContainer>
          <EmptyState
            title="Nothing to check out"
            description="Your cart is empty. Add some products before proceeding to checkout."
            className="rounded-[2rem]"
          >
            <Link href="/products" className="mt-4 inline-block">
              <PrimaryButton type="button">Browse products</PrimaryButton>
            </Link>
          </EmptyState>
        </ResponsiveContainer>
      </SectionContainer>
    );
  }

  const hasUnavailableItems = cart.items.some((item) => item.unavailable !== null);

  return (
    <SectionContainer spacing="md">
      <ResponsiveContainer className="space-y-8">
        <header className="space-y-2">
          <Heading as="h1" size="h1">Checkout</Heading>
          <Text variant="muted">
            Review your order and pay securely with Razorpay. Prices are calculated on our server at checkout time.
          </Text>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          {/* Items */}
          <div className="space-y-4">
            {cart.items.map((item) => (
              <BaseCard key={item.id} className="flex gap-4 p-4 sm:gap-6 sm:p-5">
                <Link href={`/products/${item.product.slug}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-50 sm:h-24 sm:w-24">
                  <Image
                    src={item.product.images[0]?.url ?? '/images/placeholder.svg'}
                    alt={item.product.name}
                    fill
                    className="object-contain p-3"
                  />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                  <div>
                    <Link href={`/products/${item.product.slug}`} className="font-semibold text-slate-900 hover:text-blue-700">
                      {item.product.name}
                    </Link>
                    {item.variant ? (
                      <Text variant="caption" className="text-slate-500">
                        {item.variant.optionName}: {item.variant.optionValue}
                      </Text>
                    ) : null}
                    <div className="mt-0.5 flex items-center gap-3">
                      <Text variant="small" className="font-bold text-slate-900">
                        {formatPrice(item.unitPrice)}
                      </Text>
                      <Text variant="caption" className="text-slate-400">× {item.quantity}</Text>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <Text variant="small" className="font-bold text-slate-900">
                      {formatPrice(item.lineTotal)}
                    </Text>
                    {item.unavailable ? (
                      <Text as="span" variant="small" className="font-semibold text-rose-600">
                        {item.unavailable}
                      </Text>
                    ) : null}
                  </div>
                </div>
              </BaseCard>
            ))}


          </div>

          {/* Order summary */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <BaseCard className="space-y-4">
              <Heading as="h2" size="h4">Order summary</Heading>
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">{formatPrice(cart.subtotal)}</span>
                </div>
              </div>
              <CheckoutButton
                total={cart.total}
                currency={cart.currency}


                businessName={publicContent.businessProfile.name}
                disabled={hasUnavailableItems}
              />

              {hasUnavailableItems ? (
                <Text variant="caption" className="text-center text-rose-600">
                  Some items are unavailable. Please review your cart before paying.
                </Text>
              ) : null}

              <Text variant="caption" className="text-center text-slate-400">
                Payments are processed securely by Razorpay.
              </Text>
            </BaseCard>
          </div>
        </div>
      </ResponsiveContainer>
    </SectionContainer>
  );
}
