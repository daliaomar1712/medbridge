-- Coupon reuse by the same account is allowed; global maxUses still applies.
DROP INDEX IF EXISTS "coupon_usages_couponId_userId_key";
