import { NextRequest } from 'next/server';

import { buildApiError, buildApiSuccess, parseQueryParam } from '@/lib/api-utils';
import { getProductSearchSuggestions } from '@/lib/products';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = parseQueryParam(searchParams.get('q') ?? undefined);

    if (!query || query.length < 2) {
      return Response.json(buildApiSuccess({ suggestions: [] }));
    }

    const { products, categories } = await getProductSearchSuggestions(query);

    const suggestions = [
      ...products.map((product) => ({
        id: product.id,
        label: product.name,
        href: `/products/${product.slug}`,
        type: 'product' as const,
        image: product.images[0]?.url ?? null,
        meta: product.category.name,
      })),
      ...categories.map((category) => ({
        id: category.id,
        label: category.name,
        href: `/categories/${category.slug}`,
        type: 'category' as const,
        image: category.image,
        meta: 'Category',
      })),
    ];

    return Response.json(buildApiSuccess({ suggestions }));
  } catch {
    return Response.json(buildApiError('Unable to load search suggestions.', 'INTERNAL_SERVER_ERROR'), { status: 500 });
  }
}
