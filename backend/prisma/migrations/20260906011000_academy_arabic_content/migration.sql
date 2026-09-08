ALTER TABLE "academy_profile"
  ADD COLUMN "nameAr" TEXT,
  ADD COLUMN "taglineAr" TEXT,
  ADD COLUMN "descriptionAr" TEXT;

UPDATE "academy_profile"
SET "nameAr" = 'أكاديمية ميد بريدج',
    "taglineAr" = 'تدريب طبي عملي لطلاب الطب والعاملين في المجال الصحي.',
    "descriptionAr" = 'تشمل الدورات المهارات الجراحية الأساسية، والمناظير، والطوارئ، وطب العيون، وتخطيط وصدى القلب، والموجات فوق الصوتية وغيرها. تعلّم، وتدرّب، وتطوّر.'
WHERE "id" = 1;
