import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { buildApiError, buildApiSuccess, formatZodErrorMessage } from '@/lib/api-utils';
import { ADMIN_AUTH_COOKIE, verifyAdminSession } from '@/lib/auth/server';
import { deleteBanner, getAdminBannerById, parseBannerForm, updateBanner, updateBannerActiveState } from '@/lib/banners';

const activeStateSchema = z.object({
  isActive: z.coerce.boolean(),
});

async function requireAdminSession(request: NextRequest) {
  const token = request.cookies.get(ADMIN_AUTH_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return verifyAdminSession(token);
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession(request);

    if (!session) {
      return NextResponse.json(buildApiError('Unauthorized.', 'UNAUTHORIZED'), { status: 401 });
    }

    const { id } = await context.params;
    const banner = await getAdminBannerById(id);

    if (!banner) {
      return NextResponse.json(buildApiError('Banner not found.', 'NOT_FOUND'), { status: 404 });
    }

    return NextResponse.json(buildApiSuccess(banner));
  } catch {
    return NextResponse.json(buildApiError('Unable to load banner.', 'INTERNAL_SERVER_ERROR'), { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession(request);

    if (!session) {
      return NextResponse.json(buildApiError('Unauthorized.', 'UNAUTHORIZED'), { status: 401 });
    }

    const { id } = await context.params;
    const formData = await request.formData();
    const input = parseBannerForm(formData);
    const banner = await updateBanner(id, input);

    if (!banner) {
      return NextResponse.json(buildApiError('Banner not found.', 'NOT_FOUND'), { status: 404 });
    }

    return NextResponse.json(buildApiSuccess(banner));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(buildApiError(formatZodErrorMessage(error), 'INVALID_INPUT'), { status: 400 });
    }

    return NextResponse.json(buildApiError('Unable to update banner.', 'INTERNAL_SERVER_ERROR'), { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession(request);

    if (!session) {
      return NextResponse.json(buildApiError('Unauthorized.', 'UNAUTHORIZED'), { status: 401 });
    }

    const { id } = await context.params;
    const payload = activeStateSchema.parse(await request.json());
    const banner = await updateBannerActiveState(id, payload.isActive);

    if (!banner) {
      return NextResponse.json(buildApiError('Banner not found.', 'NOT_FOUND'), { status: 404 });
    }

    return NextResponse.json(buildApiSuccess(banner));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(buildApiError(formatZodErrorMessage(error), 'INVALID_INPUT'), { status: 400 });
    }

    return NextResponse.json(buildApiError('Unable to update banner.', 'INTERNAL_SERVER_ERROR'), { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession(request);

    if (!session) {
      return NextResponse.json(buildApiError('Unauthorized.', 'UNAUTHORIZED'), { status: 401 });
    }

    const { id } = await context.params;
    const deleted = await deleteBanner(id);

    if (!deleted) {
      return NextResponse.json(buildApiError('Banner not found.', 'NOT_FOUND'), { status: 404 });
    }

    return NextResponse.json(buildApiSuccess({ deleted: true }));
  } catch {
    return NextResponse.json(buildApiError('Unable to delete banner.', 'INTERNAL_SERVER_ERROR'), { status: 500 });
  }
}
