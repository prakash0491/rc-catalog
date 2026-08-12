-- Admin CMS expansion: publishing, inventory, pricing, SEO, thumbnails, specs, and variants.

CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PUBLISHED');

ALTER TABLE "Product"
  ADD COLUMN "mrp" DECIMAL(10, 2),
  ADD COLUMN "discountPercent" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "sku" VARCHAR(80),
  ADD COLUMN "stockQuantity" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN "bestSeller" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "metaTitle" VARCHAR(160),
  ADD COLUMN "metaDescription" TEXT,
  ADD COLUMN "deletedAt" TIMESTAMP(3);

ALTER TABLE "ProductImage"
  ADD COLUMN "isThumbnail" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "ProductSpecification" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "value" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProductSpecification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductVariant" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "optionName" VARCHAR(80) NOT NULL,
  "optionValue" VARCHAR(120) NOT NULL,
  "sku" VARCHAR(80),
  "priceOverride" DECIMAL(10, 2),
  "stockQuantity" INTEGER NOT NULL DEFAULT 0,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Product_status_idx" ON "Product"("status");
CREATE INDEX "Product_deletedAt_idx" ON "Product"("deletedAt");
CREATE INDEX "Product_bestSeller_idx" ON "Product"("bestSeller");
CREATE INDEX "Product_sku_idx" ON "Product"("sku");
CREATE INDEX "ProductImage_productId_isThumbnail_idx" ON "ProductImage"("productId", "isThumbnail");
CREATE INDEX "ProductSpecification_productId_sortOrder_idx" ON "ProductSpecification"("productId", "sortOrder");
CREATE INDEX "ProductVariant_productId_sortOrder_idx" ON "ProductVariant"("productId", "sortOrder");
CREATE INDEX "ProductVariant_optionName_optionValue_idx" ON "ProductVariant"("optionName", "optionValue");

ALTER TABLE "ProductSpecification"
  ADD CONSTRAINT "ProductSpecification_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductVariant"
  ADD CONSTRAINT "ProductVariant_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
