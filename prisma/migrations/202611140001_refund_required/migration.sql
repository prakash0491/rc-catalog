-- A captured payment that could not reserve inventory needs manual refunding.
-- Keeping this state separate from PAYMENT_FAILED preserves the fact that the
-- customer was actually charged.
ALTER TYPE "OrderStatus" ADD VALUE 'REFUND_REQUIRED';
