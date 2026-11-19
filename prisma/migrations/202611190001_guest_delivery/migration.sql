BEGIN;
ALTER TABLE "Order" ALTER COLUMN "customerId" DROP NOT NULL,
  ADD COLUMN "guestSessionId" TEXT,
  ADD COLUMN "recipientName" TEXT,
  ADD COLUMN "mobile" TEXT,
  ADD COLUMN "address" TEXT,
  ADD COLUMN "pinCode" TEXT,
  ADD COLUMN "porterBooking" TEXT,
  ADD COLUMN "deliveryFee" DECIMAL(10,2) NOT NULL DEFAULT 0;
CREATE INDEX "Order_guestSessionId_createdAt_idx" ON "Order" ("guestSessionId","createdAt");
ALTER TABLE "Order" ADD COLUMN "checkoutKey" TEXT;
CREATE UNIQUE INDEX "Order_checkoutKey_key" ON "Order" ("checkoutKey");
COMMIT;
