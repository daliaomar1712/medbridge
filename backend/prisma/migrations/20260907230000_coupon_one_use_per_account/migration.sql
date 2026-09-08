-- Prevent the same account from consuming one coupon more than once,
-- including concurrent enrollment requests.
CREATE UNIQUE INDEX "coupon_usages_couponId_userId_key"
ON "coupon_usages"("couponId", "userId");
