import { v2 as cloudinary } from 'cloudinary';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function assertCloudinaryConfigured() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary credentials are not configured.');
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

function validateImageFile(file: File) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Only JPEG, PNG, WebP, and GIF images are supported.');
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('Image must be 5 MB or smaller.');
  }
}

async function uploadImage(file: File, folder: string, publicId?: string) {
  assertCloudinaryConfigured();
  validateImageFile(file);

  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUri = `data:${file.type};base64,${buffer.toString('base64')}`;

  try {
    const result = await cloudinary.uploader.upload(dataUri, {
      folder,
      ...(publicId ? { public_id: publicId } : {}),
      resource_type: 'image',
      overwrite: false,
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    // With a deterministic public id and overwrite disabled, re-uploading an
    // asset that already exists fails. Resolve the existing asset instead so
    // imports can be safely re-run without creating duplicate uploads.
    if (publicId && error instanceof Error && /already exists/i.test(error.message)) {
      const existing = await cloudinary.api.resource(`${folder}/${publicId}`);
      return {
        url: existing.secure_url,
        publicId: existing.public_id,
        width: existing.width,
        height: existing.height,
      };
    }

    throw error;
  }
}

export async function uploadBannerImage(file: File) {
  return uploadImage(file, 'rc-catalog/banners');
}

export async function uploadProductImage(file: File, publicId?: string) {
  return uploadImage(file, 'rc-catalog/products', publicId);
}
