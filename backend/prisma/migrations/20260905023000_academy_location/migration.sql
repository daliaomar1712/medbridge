ALTER TABLE "academy_profile"
ADD COLUMN "location" TEXT NOT NULL DEFAULT 'Mansoura, Egypt';

UPDATE "academy_profile" SET "location" = 'Mansoura, Egypt' WHERE "id" = 1;
