// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type { ImgHTMLAttributes } from 'react';

const router = vi.hoisted(() => ({ refresh: vi.fn(), push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));
// Native image is intentional: jsdom cannot run Next's image optimizer.
// eslint-disable-next-line @next/next/no-img-element
vi.mock('next/image', () => ({ default: (props: ImgHTMLAttributes<HTMLImageElement>) => <img {...props} alt={props.alt} /> }));
import { ImageWithFallback } from '@/components/common/image-with-fallback';
import { AddToCartButton } from '@/components/product/add-to-cart-button';
import { CheckoutButton } from '@/components/checkout/checkout-button';
import { ProductPurchaseOptions } from '@/components/product/product-purchase-options';
import { EmptyState } from '@/components/ui';
import CartPage from '@/app/cart/page';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('product images', () => {
  it('falls back when the image fails', () => {
    render(<ImageWithFallback src="/broken.jpg" alt="Product" width={100} height={100} />);
    fireEvent.error(screen.getByAltText('Product'));
    expect(screen.getByAltText('Product')).toHaveAttribute('src', '/images/placeholder.svg');
  });
  it('updates when a reused component receives a different image', () => {
    const { rerender } = render(<ImageWithFallback src="/first.jpg" alt="Product" width={100} height={100} />);
    rerender(<ImageWithFallback src="/second.jpg" alt="Product" width={100} height={100} />);
    expect(screen.getByAltText('Product')).toHaveAttribute('src', '/second.jpg');
  });
  it('recovers from a broken old image when a new source arrives', () => {
    const { rerender } = render(<ImageWithFallback src="/broken.jpg" alt="Product" width={100} height={100} />);
    fireEvent.error(screen.getByAltText('Product'));
    rerender(<ImageWithFallback src="/new.jpg" alt="Product" width={100} height={100} />);
    expect(screen.getByAltText('Product')).toHaveAttribute('src', '/new.jpg');
  });
});
describe('add to cart feedback', () => {
  it('shows stock errors instead of silently failing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 409, json: async () => ({ error: { message: 'Insufficient stock.' } }) }));
    render(<AddToCartButton productId="p" />);
    fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Insufficient stock.');
  });
  it('shows network failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    render(<AddToCartButton productId="p" />);
    fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to add');
  });
  it('sends the selected variant and quantity', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    render(<AddToCartButton productId="p" variantId="v" />);
    fireEvent.click(screen.getByRole('button', { name: 'Increase quantity' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }));
    expect(await screen.findByRole('button', { name: 'Added!' })).toBeInTheDocument();
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ productId: 'p', variantId: 'v', quantity: 2 });
  });
});
describe('checkout display', () => {
  it('shows the precise charge and respects unavailable items', () => {
    render(<CheckoutButton total={19.99} currency="INR" businessName="RC" disabled />);
    expect(screen.getByRole('button', { name: 'Pay ₹19.99' })).toBeDisabled();
  });

  it('ignores an earlier delivery response that arrives after the current quote', async () => {
    const pending = Promise.withResolvers<Response>();
    vi.stubGlobal('fetch', vi.fn()
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce(Response.json({ fee: 5000 })));
    render(<CheckoutButton total={100} currency="INR" businessName="RC" />);

    const pin = screen.getByLabelText('PIN code');
    fireEvent.change(pin, { target: { value: '50001' } });
    fireEvent.click(screen.getByRole('button', { name: 'Check delivery' }));
    expect(screen.getByRole('alert')).toHaveTextContent('six-digit');
    expect(fetch).not.toHaveBeenCalled();
    fireEvent.change(pin, { target: { value: '560001' } });
    fireEvent.change(pin, { target: { value: '560002' } });
    expect(await screen.findByRole('button', { name: 'Pay ₹150' })).toBeEnabled();

    await act(async () => pending.resolve(Response.json({ fee: null })));
    expect(screen.getByRole('button', { name: 'Pay ₹150' })).toBeEnabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('keeps payment disabled when the delivery endpoint returns an invalid response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: 'unavailable' }, { status: 503 })));
    render(<CheckoutButton total={100} currency="INR" businessName="RC" />);
    fireEvent.change(screen.getByLabelText('PIN code'), { target: { value: '560001' } });
    fireEvent.click(screen.getByRole('button', { name: 'Check delivery' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not check delivery.');
    expect(screen.getByRole('button', { name: 'Pay ₹100' })).toBeDisabled();
  });
});

describe('shopping cart', () => {
  it('refreshes the header after removing the last item', async () => {
    router.refresh.mockClear();
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(Response.json({ success: true, data: { cart: { id: 'cart', items: [{
        id: 'item', productId: 'car', variantId: null, quantity: 1, variant: null,
        product: { id: 'car', slug: 'rc-car', name: 'RC car', price: 100, images: [] },
      }] } } }))
      .mockResolvedValueOnce(Response.json({ success: true, data: { removed: true } }))
      .mockResolvedValueOnce(Response.json({ success: true, data: { cart: { id: 'cart', items: [] } } })));
    render(<CartPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Remove RC car from cart' }));

    expect(await screen.findByText('Your cart is empty')).toBeInTheDocument();
    expect(router.refresh).toHaveBeenCalledOnce();
  });
});

describe('variant purchasing', () => {
  const variants = [
    { id: 'large', optionName: 'Size', optionValue: 'Large', sku: null, priceOverride: 29.99, stockQuantity: 2 },
    { id: 'small', optionName: 'Size', optionValue: 'Small', sku: null, priceOverride: null, stockQuantity: 0 },
  ];
  it('requires an available variant and submits its identity', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    render(<ProductPurchaseOptions productId="p" stockQuantity={0} variants={variants} />);
    expect(screen.queryByRole('button', { name: 'Add to cart' })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Size: Small — Out of stock' })).toBeDisabled();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'large' } });
    expect(screen.getByText('Selected option price: ₹29.99')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }));
    await screen.findByRole('button', { name: 'Added!' });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).variantId).toBe('large');
  });
  it('does not offer checkout for an unavailable base product', () => {
    render(<ProductPurchaseOptions productId="p" stockQuantity={0} variants={[]} />);
    expect(screen.queryByRole('button', { name: 'Add to cart' })).not.toBeInTheDocument();
  });
});

describe('empty states', () => {
  it('renders its call to action instead of dropping it', () => {
    render(
      <EmptyState title="Nothing here" description="Add something first.">
        <button type="button">Browse products</button>
      </EmptyState>
    );
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Browse products' })).toBeInTheDocument();
  });
});
