/**
 * Populates the product catalog from the source images in /assets.
 *
 * Pipeline per image:
 *   /assets/<file>  ->  Cloudinary (existing uploadProductImage integration)
 *                   ->  ProductImage + Product (existing createAdminProduct service)
 *
 * Idempotency:
 *   - Each asset maps to a deterministic SKU (RC-<basename>); if a product with
 *     that SKU already exists the import skips it.
 *   - Each upload uses a deterministic Cloudinary public id with overwrite disabled;
 *     an existing asset is resolved instead of re-uploaded.
 *
 * Run: npx tsx scripts/import-assets.ts
 */
import 'dotenv/config';

import { ProductStatus, StockStatus } from '@prisma/client';
import { readFile } from 'node:fs/promises';
import { basename, extname } from 'node:path';

import { prisma } from '@/lib/prisma';
import { uploadProductImage } from '@/lib/cloudinary';
import { createAdminProduct, type AdminProductFormInput } from '@/lib/admin-products';
import { resolveUniqueCategorySlug } from '@/lib/categories';
import { catalog, categoriesToEnsure, duplicateAssets, skippedAssets } from './product-catalog';

const ASSETS_DIR = 'assets';
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

function mimeFromFilename(file: string): string {
  const ext = extname(file).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
    case '.jfif':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    default:
      throw new Error(`Unsupported image extension for ${file}`);
  }
}

/** Deterministic unique SKU derived from the asset filename. */
function buildSku(file: string): string {
  const base = basename(file, extname(file))
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 60);

  return base ? `RC-${base}` : `RC-ASSET-${file.length}`;
}

function buildPublicId(sku: string): string {
  return sku.toLowerCase();
}

type ImportCounters = {
  totalFiles: number;
  catalogEntries: number;
  created: number;
  skippedAlreadyImported: number;
  uploaded: number;
  productImagesCreated: number;
  published: number;
  draft: number;
  needsReview: number;
  errors: Array<{ file: string; message: string }>;
};

async function ensureCategories(): Promise<Map<string, string>> {
  const slugToId = new Map<string, string>();

  for (const category of categoriesToEnsure) {
    const existing = await prisma.category.findUnique({ where: { slug: category.slug } });

    if (existing) {
      slugToId.set(category.slug, existing.id);
      continue;
    }

    const slug = await resolveUniqueCategorySlug(category.slug);
    const created = await prisma.category.create({
      data: {
        name: category.name,
        slug,
        description: category.description,
        image: null,
        displayOrder: category.displayOrder,
        isActive: true,
      },
      select: { id: true },
    });

    slugToId.set(category.slug, created.id);
    console.log(`Created category "${category.name}" (${slug}).`);
  }

  return slugToId;
}

async function importAsset(entry: (typeof catalog)[number], categoryId: string, counters: ImportCounters) {
  const { file } = entry;
  const sku = buildSku(file);

  try {
    // Duplicate protection: same asset already imported (deterministic SKU).
    const existingBySku = await prisma.product.findFirst({
      where: { sku },
      select: { id: true, name: true },
    });

    if (existingBySku) {
      counters.skippedAlreadyImported += 1;
      console.log(`SKIP ${file}: product "${existingBySku.name}" already exists for SKU ${sku}.`);
      return;
    }

    // Duplicate protection: same product name already imported.
    const existingByName = await prisma.product.findFirst({
      where: { name: entry.name, deletedAt: null },
      select: { id: true },
    });

    if (existingByName) {
      counters.skippedAlreadyImported += 1;
      console.log(`SKIP ${file}: product "${entry.name}" already exists.`);
      return;
    }

    const buffer = await readFile(`${ASSETS_DIR}/${file}`);

    if (buffer.byteLength > MAX_IMAGE_SIZE_BYTES) {
      throw new Error(`Image is ${(buffer.byteLength / 1024 / 1024).toFixed(1)} MB; the existing uploader allows up to 5 MB.`);
    }

    const mime = mimeFromFilename(file);
    const imageFile = new File([new Uint8Array(buffer)], file, { type: mime });

    const upload = await uploadProductImage(imageFile, buildPublicId(sku));
    counters.uploaded += 1;

    const input: AdminProductFormInput = {
      name: entry.name,
      slug: '',
      shortDescription: entry.shortDescription,
      description: entry.description,
      // No reliable market price was verifiable for this product; the owner must
      // set a price before publishing. Price 0 keeps the record editable and DRAFT.
      price: 0,
      mrp: null,
      discountPercent: 0,
      sku,
      stockQuantity: 0,
      lowStockThreshold: 5,
      categoryId,
      featured: false,
      newArrival: false,
      bestSeller: false,
      status: ProductStatus.DRAFT,
      isActive: false,
      stockStatus: StockStatus.OUT_OF_STOCK,
      metaTitle: entry.metaTitle,
      metaDescription: entry.metaDescription,
      images: [upload.url],
      thumbnailImage: upload.url,
      specifications: entry.specs,
      variants: [],
    };

    const product = await createAdminProduct(input);

    if (!product) {
      throw new Error('createAdminProduct returned null.');
    }

    counters.created += 1;
    if (product.status === ProductStatus.PUBLISHED) {
      counters.published += 1;
    } else {
      counters.draft += 1;
    }

    if (!entry.identified) {
      counters.needsReview += 1;
    }

    const imageCount = await prisma.productImage.count({ where: { productId: product.id } });
    counters.productImagesCreated += imageCount;
    console.log(
      `OK ${file} -> "${product.name}" (${product.slug}) | image: ${upload.url} | images: ${imageCount} | status: ${product.status}`
    );
  } catch (error) {
    counters.errors.push({ file, message: error instanceof Error ? error.message : String(error) });
    console.error(`ERROR ${file}:`, error instanceof Error ? error.message : error);
  }
}

async function main() {
  const counters: ImportCounters = {
    totalFiles: 0,
    catalogEntries: catalog.length,
    created: 0,
    skippedAlreadyImported: 0,
    uploaded: 0,
    productImagesCreated: 0,
    published: 0,
    draft: 0,
    needsReview: 0,
    errors: [],
  };

  const categorySlugToId = await ensureCategories();

  console.log(`\nImporting ${catalog.length} assets...\n`);

  for (const entry of catalog) {
    const categoryId = categorySlugToId.get(entry.category);

    if (!categoryId) {
      counters.errors.push({ file: entry.file, message: `Category "${entry.category}" not found.` });
      console.error(`ERROR ${entry.file}: category "${entry.category}" missing.`);
      continue;
    }

    await importAsset(entry, categoryId, counters);
  }

  // Report duplicates and intentionally skipped assets.
  for (const [duplicate, original] of Object.entries(duplicateAssets)) {
    console.log(`DUP ${duplicate}: byte-identical copy of ${original}, skipped as duplicate.`);
  }

  for (const skipped of skippedAssets) {
    console.log(`SKIPPED ${skipped.file}: ${skipped.reason}`);
  }

  const { readdir } = await import('node:fs/promises');
  counters.totalFiles = (await readdir(ASSETS_DIR)).filter((f) => !f.startsWith('.')).length;

  console.log('\n================ IMPORT REPORT ================');
  console.log(`Total files in /assets           : ${counters.totalFiles}`);
  console.log(`Catalog entries (unique products): ${counters.catalogEntries}`);
  console.log(`Duplicate asset files            : ${Object.keys(duplicateAssets).length}`);
  console.log(`Skipped assets (unidentifiable)  : ${skippedAssets.length}`);
  console.log(`Products created                 : ${counters.created}`);
  console.log(`Already imported / skipped       : ${counters.skippedAlreadyImported}`);
  console.log(`Cloudinary uploads               : ${counters.uploaded}`);
  console.log(`ProductImage records created     : ${counters.productImagesCreated}`);
  console.log(`Products PUBLISHED               : ${counters.published}`);
  console.log(`Products left as DRAFT           : ${counters.draft}`);
  console.log(`Products requiring manual review : ${counters.needsReview}`);
  console.log(`Errors                           : ${counters.errors.length}`);

  if (counters.errors.length > 0) {
    console.log('\nErrors:');
    for (const error of counters.errors) {
      console.log(`  - ${error.file}: ${error.message}`);
    }
  }

  console.log('===============================================');
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
