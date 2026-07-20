import { NextRequest, NextResponse } from 'next/server';

import { buildApiError, buildApiSuccess } from '@/lib/api-utils';
import { ADMIN_AUTH_COOKIE, verifyAdminSession } from '@/lib/auth';
import { uploadProductImage } from '@/lib/cloudinary';

async function requireAdminSession(request: NextRequest) {
  const token = request.cookies.get(ADMIN_AUTH_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return verifyAdminSession(token);
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession(request);

    if (!session) {
      return NextResponse.json(buildApiError('Unauthorized.', 'UNAUTHORIZED'), { status: 401 });
    }

    const formData = await request.formData();
    const image = formData.get('image');

    if (!(image instanceof File)) {
      return NextResponse.json(buildApiError('Image file is required.', 'INVALID_INPUT'), { status: 400 });
    }

    const upload = await uploadProductImage(image);

    return NextResponse.json(buildApiSuccess(upload), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to upload product image.';
    const status = message.includes('Cloudinary credentials') ? 500 : 400;

    return NextResponse.json(buildApiError(message, 'UPLOAD_FAILED'), { status });
  }
}
