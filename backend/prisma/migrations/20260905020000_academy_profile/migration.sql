CREATE TABLE "academy_profile" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL DEFAULT 'Med Bridge Academy',
    "tagline" TEXT NOT NULL DEFAULT 'Practical medical training for students and healthcare professionals.',
    "description" TEXT NOT NULL DEFAULT 'Learn. Practice. Grow.',
    "whatsappUrl" TEXT,
    "whatsappChannel" TEXT,
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "tiktokUrl" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "suturingVideosUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "academy_profile_pkey" PRIMARY KEY ("id")
);
