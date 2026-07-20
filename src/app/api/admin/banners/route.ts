import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { buildApiError, buildApiSuccess, parsePaginationParams, parseQueryParam } from '@/lib/api-utils';
import { ADMIN_AUTH_COOKIE, verifyAdminSession } from '@/lib/auth';
import { createBanner, listAdminBanners, parseBannerForm } from '@/lib/banners';

async function requireAdminSession(request: NextRequest) {
  const token = request.cookies.get(ADMIN_AUTH_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return verifyAdminSession(token);
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSession(request);

    if (!session) {
      return NextResponse.json(buildApiError('Unauthorized.', 'UNAUTHORIZED'), { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = parseQueryParam(searchParams.get('search') ?? undefined);
    const { page, limit } = parsePaginationParams(searchParams.get('page') ?? undefined, searchParams.get('limit') ?? undefined);
    const data = await listAdminBanners({ search, page, limit });

    return NextResponse.json(buildApiSuccess(data));
  } catch {
    return NextResponse.json(buildApiError('Unable to load banners.', 'INTERNAL_SERVER_ERROR'), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession(request);

    if (!session) {
      return NextResponse.json(buildApiError('Unauthorized.', 'UNAUTHORIZED'), { status: 401 });
    }

    const formData = await request.formData();
    const input = parseBannerForm(formData);
    const banner = await createBanner(input);

    return NextResponse.json(buildApiSuccess(banner), { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(buildApiError('Invalid banner data.', 'INVALID_INPUT'), { status: 400 });
    }

    return NextResponse.json(buildApiError('Unable to create banner.', 'INTERNAL_SERVER_ERROR'), { status: 500 });
  }
}
