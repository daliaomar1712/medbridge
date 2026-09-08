INSERT INTO "academy_profile" (
  "id", "name", "tagline", "description", "suturingVideosUrl", "whatsappUrl", "whatsappChannel",
  "facebookUrl", "instagramUrl", "tiktokUrl", "email", "phone", "updatedAt"
) VALUES (
  1,
  'Med Bridge Academy',
  'Practical medical training for students and healthcare professionals.',
  'Courses include Basic Surgical Skills, Basic Laparoscopic Skills, Emergency Skills, Ophthalmology Skills, ECG & Echo Skills, Ultrasound Skills, and more. Learn. Practice. Grow.',
  'https://drive.google.com/drive/folders/1aryHYM1yEX8FDnfb2HIlyTIegGS7eO_i?usp=drive_link',
  'https://wa.me/201117967907',
  'https://chat.whatsapp.com/COxV0AiyMsE0Sa8rR3qiQe?s=cl&p=i&ilr=0',
  'https://www.facebook.com/share/18pqRHLZSX/?mibextid=wwXIfr',
  'https://www.instagram.com/med_bridge.academy',
  'https://www.tiktok.com/@med_bridge.academy?_r=1&_t=ZS-97UF2yUXB6S',
  'medbridge.eg@gmail.com',
  '+201503500330',
  CURRENT_TIMESTAMP
) ON CONFLICT ("id") DO NOTHING;
