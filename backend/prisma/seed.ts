import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log(' Seeding Med Bridge Academy database...');

  // ─── Admin User ──────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@medbridge.com' },
    update: {},
    create: {
      email: 'admin@medbridge.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'MedBridge',
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin user:', admin.email);

  // ─── Demo Student ─────────────────────────────────────────────────────────────
  const studentPassword = await bcrypt.hash('Student@123', 12);
  await prisma.user.upsert({
    where: { email: 'student@medbridge.com' },
    update: {},
    create: {
      email: 'student@medbridge.com',
      password: studentPassword,
      firstName: 'Ahmed',
      lastName: 'Hassan',
      phone: '+966501234567',
      role: 'USER',
    },
  });
  console.log('✅ Demo student user created');

  await prisma.academyProfile.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Med Bridge Academy',
      nameAr: 'أكاديمية ميد بريدج',
      tagline: 'Practical medical training for students and healthcare professionals.',
      taglineAr: 'تدريب طبي عملي لطلاب الطب والعاملين في المجال الصحي.',
      description: 'Courses include Basic Surgical Skills, Basic Laparoscopic Skills, Emergency Skills, Ophthalmology Skills, ECG & Echo Skills, Ultrasound Skills, and more. Learn. Practice. Grow.',
      descriptionAr: 'تشمل الدورات المهارات الجراحية الأساسية والمناظير والطوارئ وطب العيون وتخطيط وصدى القلب والموجات فوق الصوتية وغيرها. تعلّم، وتدرّب، وتطوّر.',
      suturingVideosUrl: 'https://drive.google.com/drive/folders/1aryHYM1yEX8FDnfb2HIlyTIegGS7eO_i?usp=drive_link',
      whatsappUrl: 'https://wa.me/201117967907',
      whatsappChannel: 'https://chat.whatsapp.com/COxV0AiyMsE0Sa8rR3qiQe?s=cl&p=i&ilr=0',
      facebookUrl: 'https://www.facebook.com/share/18pqRHLZSX/?mibextid=wwXIfr',
      instagramUrl: 'https://www.instagram.com/med_bridge.academy',
      tiktokUrl: 'https://www.tiktok.com/@med_bridge.academy?_r=1&_t=ZS-97UF2yUXB6S',
      email: 'medbridge.eg@gmail.com',
      phone: '+201503500330',
      location: 'Mansoura, Egypt',
    },
  });

  // ─── Courses ──────────────────────────────────────────────────────────────────
  const courses = [
    {
      title_en: 'Basic Surgical Skills',
      title_ar: 'المهارات الجراحية الأساسية',
      description_en: 'This comprehensive course covers the fundamental surgical techniques required for medical students and junior doctors. Topics include sterile technique, wound closure, suturing methods, knot tying, and basic instrument handling. Participants will gain hands-on experience in a simulated surgical environment.',
      description_ar: 'يغطي هذا المقرر الشامل التقنيات الجراحية الأساسية المطلوبة لطلاب الطب والأطباء المبتدئين. تشمل الموضوعات: تقنية التعقيم، إغلاق الجروح، طرق الخياطة، ربط العقد، والتعامل الأساسي مع الأدوات الجراحية.',
      price: 499.00,
      duration: '2 Days',
      image: 'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=800',
      status: 'ACTIVE' as const,
      category: 'Surgery',
      maxStudents: 20,
    },
    {
      title_en: 'Basic Laparoscopic Skills',
      title_ar: 'المهارات التنظيرية الأساسية',
      description_en: 'An intensive hands-on course introducing surgeons and surgical trainees to laparoscopic surgery fundamentals. Covers camera navigation, instrument coordination, tissue handling in a 2D environment, and basic laparoscopic procedures using box trainers and simulators.',
      description_ar: 'دورة مكثفة عملية تُعرّف الجراحين والمتدربين الجراحيين بأساسيات الجراحة بالمنظار. يغطي المقرر: التنقل بالكاميرا، تنسيق الأدوات، التعامل مع الأنسجة، والإجراءات التنظيرية الأساسية.',
      price: 699.00,
      duration: '3 Days',
      image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800',
      status: 'ACTIVE' as const,
      category: 'Surgery',
      maxStudents: 15,
    },
    {
      title_en: 'Emergency Skills',
      title_ar: 'مهارات الطوارئ',
      description_en: 'Equip healthcare professionals with life-saving emergency skills including ACLS, trauma management, airway management, and rapid assessment protocols. This course follows international resuscitation guidelines and uses high-fidelity simulation mannequins.',
      description_ar: 'تزويد المهنيين الصحيين بمهارات الطوارئ المنقذة للحياة بما في ذلك دعم الحياة القلبي المتقدم، إدارة الصدمات، إدارة مجرى الهواء، وبروتوكولات التقييم السريع.',
      price: 599.00,
      duration: '2 Days',
      image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800',
      status: 'ACTIVE' as const,
      category: 'Emergency Medicine',
      maxStudents: 25,
    },
    {
      title_en: 'Ophthalmology Skills',
      title_ar: 'مهارات طب العيون',
      description_en: 'A structured course in clinical ophthalmology covering slit lamp examination, fundoscopy, visual acuity assessment, common eye conditions management, and basic ophthalmic procedures. Ideal for medical officers, GPs, and ophthalmology trainees.',
      description_ar: 'دورة منظمة في طب العيون السريري تغطي فحص المصباح الشقي، قاع العين، تقييم حدة البصر، إدارة أمراض العيون الشائعة، والإجراءات الأساسية لطب العيون.',
      price: 449.00,
      duration: '2 Days',
      image: 'https://images.unsplash.com/photo-1603813507806-4e75c2cf9e47?w=800',
      status: 'ACTIVE' as const,
      category: 'Ophthalmology',
      maxStudents: 20,
    },
    {
      title_en: 'ECG & Echo Skills',
      title_ar: 'مهارات تخطيط القلب والصدى',
      description_en: 'Master electrocardiogram interpretation and basic echocardiography in this intensive course. Topics include ECG systematic reading, common arrhythmias, ischemic patterns, point-of-care ultrasound of the heart, and basic echo views for clinical decision-making.',
      description_ar: 'أتقن تفسير مخطط القلب الكهربائي وتخطيط صدى القلب الأساسي في هذه الدورة المكثفة. تشمل الموضوعات: القراءة المنهجية لتخطيط القلب، اضطرابات النظم الشائعة، وأنماط نقص التروية.',
      price: 549.00,
      duration: '2 Days',
      image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800',
      status: 'ACTIVE' as const,
      category: 'Cardiology',
      maxStudents: 20,
    },
    {
      title_en: 'Ultrasound Skills',
      title_ar: 'مهارات الموجات فوق الصوتية',
      description_en: 'Point-of-care ultrasound (POCUS) fundamentals for clinicians. This course covers ultrasound physics, machine operation, abdominal scanning, soft tissue assessment, vascular access guidance, and the FAST exam protocol for trauma patients.',
      description_ar: 'أساسيات الموجات فوق الصوتية في نقطة الرعاية للأطباء الإكلينيكيين. تغطي هذه الدورة: فيزياء الموجات فوق الصوتية، تشغيل الجهاز، الفحص البطني، تقييم الأنسجة الرخوة، والوصول الوعائي.',
      price: 649.00,
      duration: '3 Days',
      image: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800',
      status: 'ACTIVE' as const,
      category: 'Radiology',
      maxStudents: 15,
    },
  ];

  for (const course of courses) {
    await prisma.course.upsert({
      where: { id: course.title_en.replace(/\s+/g, '-').toLowerCase() },
      update: {},
      create: course,
    });
  }
  console.log('✅ 6 courses seeded');

  // ─── Sample Coupons ───────────────────────────────────────────────────────────
  await prisma.coupon.upsert({
    where: { code: 'WELCOME20' },
    update: {},
    create: { code: 'WELCOME20', discount: 20, type: 'PERCENTAGE', maxUses: 100, isActive: true },
  });

  await prisma.coupon.upsert({
    where: { code: 'MEDBRIDGE50' },
    update: {},
    create: { code: 'MEDBRIDGE50', discount: 50, type: 'FIXED', maxUses: 50, isActive: true },
  });

  console.log('✅ Sample coupons seeded');
  console.log('');
  console.log('🎉 Seeding complete!');
  console.log('');
  console.log('Admin login: admin@medbridge.com / Admin@123456');
  console.log('Student login: student@medbridge.com / Student@123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
