import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { buildApiError, buildApiSuccess, formatZodErrorMessage } from '@/lib/api-utils';
import { ADMIN_AUTH_COOKIE, verifyAdminSession } from '@/lib/auth/server';
import { parseBusinessSettingsForm, upsertBusinessSettings } from '@/lib/business-settings';

async function requireAdminSession(request: NextRequest) {
  const token = request.cookies.get(ADMIN_AUTH_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return verifyAdminSession(token);
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAdminSession(request);

    if (!session) {
      return NextResponse.json(buildApiError('Unauthorized.', 'UNAUTHORIZED'), { status: 401 });
    }

    const input = parseBusinessSettingsForm(await request.formData());
    const settings = await upsertBusinessSettings(input);

    return NextResponse.json(buildApiSuccess(settings));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(buildApiError(formatZodErrorMessage(error), 'INVALID_INPUT'), { status: 400 });
    }

    return NextResponse.json(buildApiError('Unable to update settings.', 'INTERNAL_SERVER_ERROR'), { status: 500 });
  }
}
