const qaUserEmails = [
  "creator@content-monitor.local",
  "buyer@content-monitor.local",
  "partner@content-monitor.local",
  "inactive@content-monitor.local",
];

const qaIds = {
  creator: "qa-user-creator",
  buyer: "qa-user-buyer",
  partner: "qa-user-partner",
  inactive: "qa-user-inactive",
  creatorPage: "qa-public-creator",
  buyerPage: "qa-public-buyer",
  partnerPage: "qa-public-partner",
  ebook: "qa-product-ebook-launch",
  course: "qa-product-course-system",
  draftEbook: "qa-product-ebook-draft",
  inactiveCourse: "qa-product-course-inactive",
  disabledProduct: "qa-product-ebook-disabled",
  partnerCourse: "qa-product-partner-course",
  partnerEbook: "qa-product-partner-ebook",
  buyerCourseOrder: "qa-order-buyer-course-paid",
  buyerEbookOrder: "qa-order-buyer-ebook-paid",
  pendingOrder: "qa-order-buyer-course-pending",
  failedOrder: "qa-order-buyer-disabled-failed",
  creatorPartnerOrder: "qa-order-creator-partner-course-paid",
  expiredOrder: "qa-order-creator-partner-ebook-expired",
  buyerEnrollment: "qa-enrollment-buyer-course",
  creatorEnrollment: "qa-enrollment-creator-partner-course",
};

async function seedQaScenario({ tx, admin, hashPassword }) {
  await cleanupQaScenario(tx);

  const now = new Date();
  const dates = buildDates(now);

  await tx.user.createMany({
    data: [
      buildUser(qaIds.creator, "Rina Creator", "creator-demo", qaUserEmails[0], "CreatorPassword123!", hashPassword),
      buildUser(qaIds.buyer, "Bima Buyer", "buyer-demo", qaUserEmails[1], "BuyerPassword123!", hashPassword),
      buildUser(qaIds.partner, "Nadia Partner", "partner-demo", qaUserEmails[2], "PartnerPassword123!", hashPassword),
      {
        ...buildUser(qaIds.inactive, "Inactive User", "inactive-demo", qaUserEmails[3], "InactivePassword123!", hashPassword),
        status: "INACTIVE",
      },
    ],
  });

  await tx.platformSettings.upsert({
    where: { id: "platform" },
    update: {
      paymentProvider: "MIDTRANS",
      paymentMode: "SANDBOX",
      platformFeePercent: 5,
      maxUploadMb: 25,
      allowedMimeTypesJson: JSON.stringify(["application/pdf"]),
      publicCheckoutEnabled: true,
      learnerAccessEnabled: true,
      analyticsTrackingEnabled: true,
      updatedByUserId: admin.id,
    },
    create: {
      id: "platform",
      paymentProvider: "MIDTRANS",
      paymentMode: "SANDBOX",
      platformFeePercent: 5,
      maxUploadMb: 25,
      allowedMimeTypesJson: JSON.stringify(["application/pdf"]),
      publicCheckoutEnabled: true,
      learnerAccessEnabled: true,
      analyticsTrackingEnabled: true,
      updatedByUserId: admin.id,
    },
  });

  await tx.contentItem.createMany({
    data: buildContentItems(dates),
  });

  await tx.product.createMany({
    data: buildProducts(dates),
  });

  await tx.courseModule.createMany({
    data: buildCourseModules(),
  });
  await tx.courseLesson.createMany({
    data: buildCourseLessons(),
  });
  await tx.lessonResource.createMany({
    data: buildLessonResources(),
  });
  await tx.quiz.createMany({
    data: buildQuizzes(),
  });
  await tx.quizQuestion.createMany({
    data: buildQuizQuestions(),
  });
  await tx.quizAnswerOption.createMany({
    data: buildQuizOptions(),
  });

  await tx.publicPage.createMany({
    data: buildPublicPages(),
  });
  await tx.publicPageBlock.createMany({
    data: buildPublicPageBlocks(),
  });

  await tx.order.createMany({
    data: buildOrders(dates),
  });
  await tx.paymentTransaction.createMany({
    data: buildPaymentTransactions(dates),
  });
  await tx.enrollment.createMany({
    data: buildEnrollments(dates),
  });
  await tx.lessonProgress.createMany({
    data: buildLessonProgress(dates),
  });
  await tx.quizAttempt.createMany({
    data: buildQuizAttempts(dates),
  });
  await tx.analyticsEvent.createMany({
    data: buildAnalyticsEvents(dates),
  });
  await tx.adminAuditLog.createMany({
    data: buildAdminAuditLogs(admin.id, dates),
  });
}

async function cleanupQaScenario(tx) {
  await tx.adminAuditLog.deleteMany({ where: { id: { startsWith: "qa-" } } });
  await tx.analyticsEvent.deleteMany({ where: { id: { startsWith: "qa-" } } });
  await tx.quizAttempt.deleteMany({ where: { id: { startsWith: "qa-" } } });
  await tx.lessonProgress.deleteMany({ where: { id: { startsWith: "qa-" } } });
  await tx.enrollment.deleteMany({ where: { id: { startsWith: "qa-" } } });
  await tx.paymentTransaction.deleteMany({ where: { id: { startsWith: "qa-" } } });
  await tx.order.deleteMany({ where: { id: { startsWith: "qa-" } } });
  await tx.publicPageBlock.deleteMany({ where: { id: { startsWith: "qa-" } } });
  await tx.publicPage.deleteMany({ where: { id: { startsWith: "qa-" } } });
  await tx.quizAnswerOption.deleteMany({ where: { id: { startsWith: "qa-" } } });
  await tx.quizQuestion.deleteMany({ where: { id: { startsWith: "qa-" } } });
  await tx.quiz.deleteMany({ where: { id: { startsWith: "qa-" } } });
  await tx.lessonResource.deleteMany({ where: { id: { startsWith: "qa-" } } });
  await tx.courseLesson.deleteMany({ where: { id: { startsWith: "qa-" } } });
  await tx.courseModule.deleteMany({ where: { id: { startsWith: "qa-" } } });
  await tx.product.deleteMany({ where: { id: { startsWith: "qa-" } } });
  await tx.contentItem.deleteMany({ where: { id: { startsWith: "qa-" } } });
  await tx.passwordResetToken.deleteMany({
    where: { user: { email: { in: qaUserEmails } } },
  });
  await tx.user.deleteMany({
    where: {
      OR: [
        { id: { startsWith: "qa-user-" } },
        { email: { in: qaUserEmails } },
      ],
    },
  });
}

function buildUser(id, name, username, email, password, hashPassword) {
  return {
    id,
    name,
    email,
    username,
    passwordHash: hashPassword(password),
    role: "USER",
    status: "ACTIVE",
    avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`,
    bio: `${name} adalah akun QA untuk skenario Content Monitor.`,
    timezone: "Asia/Jakarta",
  };
}

function buildContentItems(dates) {
  return [
    content("qa-content-video-draft", "VIDEO_SHORT", "Hook 30 detik: Audit konten mingguan", "DRAFT", null, null, null),
    content("qa-content-video-scheduled", "VIDEO_SHORT", "Reels: 3 kesalahan CTA produk digital", "SCHEDULED", dates.tomorrow10, dates.tomorrow10, dates.tomorrow11),
    content("qa-content-carousel-scheduled", "CAROUSEL_POST", "Carousel: Framework validasi ide course", "SCHEDULED", dates.plus2AllDay, dates.plus2AllDay, dates.plus4AllDay, true),
    content("qa-content-blog-published", "BLOG", "Checklist launch produk digital tanpa tim besar", "PUBLISHED", dates.minus3, dates.minus3, dates.minus3, false, "checklist-launch-produk-digital"),
    content("qa-content-long-video-published", "LONG_VIDEO", "YouTube: Breakdown funnel konten ke checkout", "PUBLISHED", dates.plus6, dates.plus6, dates.plus6End, false, "breakdown-funnel-konten-checkout"),
    content("qa-content-blog-archived", "BLOG", "Artikel lama: eksperimen konten Q1", "ARCHIVED", dates.minus20, dates.minus20, dates.minus20, false, "eksperimen-konten-q1"),
  ];
}

function content(id, type, title, status, scheduledAt, startAt, endAt, allDay = false, slug = null) {
  return {
    id,
    userId: qaIds.creator,
    type,
    title,
    slug,
    body: `Seed QA untuk ${title}.\n\nCTA: cek produk dan jadwal publikasi.`,
    metadataJson: JSON.stringify({ source: "qa-seed", scenario: "content-bank-events" }),
    status,
    scheduledAt,
    startAt,
    endAt,
    allDay,
    timezone: "Asia/Jakarta",
    publishedAt: status === "PUBLISHED" ? scheduledAt : null,
  };
}

function buildProducts(dates) {
  return [
    product(qaIds.ebook, qaIds.creator, "EBOOK", "Creator Launch Playbook", "creator-launch-playbook", 79000, "ACTIVE", "APPROVED", "https://example.com/creator-launch-playbook.pdf", dates.minus10),
    product(qaIds.course, qaIds.creator, "COURSE", "Content System Course", "content-system-course", 249000, "ACTIVE", "APPROVED", null, dates.minus9),
    product(qaIds.draftEbook, qaIds.creator, "EBOOK", "Draft Monetization Notes", "draft-monetization-notes", 49000, "DRAFT", "APPROVED", "https://example.com/draft.pdf", dates.minus8),
    product(qaIds.inactiveCourse, qaIds.creator, "COURSE", "Inactive Repurpose Lab", "inactive-repurpose-lab", 149000, "INACTIVE", "APPROVED", null, dates.minus7),
    product(qaIds.disabledProduct, qaIds.creator, "EBOOK", "Disabled Growth Swipefile", "disabled-growth-swipefile", 99000, "ACTIVE", "DISABLED", "https://example.com/disabled.pdf", dates.minus6),
    product(qaIds.partnerCourse, qaIds.partner, "COURSE", "Partner Analytics Bootcamp", "partner-analytics-bootcamp", 199000, "ACTIVE", "APPROVED", null, dates.minus5),
    product(qaIds.partnerEbook, qaIds.partner, "EBOOK", "Partner Funnel Templates", "partner-funnel-templates", 59000, "ACTIVE", "REVIEW_REQUIRED", "https://example.com/partner-funnel.pdf", dates.minus5),
  ];
}

function product(id, userId, type, title, slug, price, status, moderationStatus, fileUrl, createdAt) {
  return {
    id,
    userId,
    type,
    title,
    slug,
    description: `Produk QA: ${title}. Digunakan untuk skenario ${type === "COURSE" ? "course, enrollment, dan quiz" : "e-book dan download"}.`,
    price,
    currency: "IDR",
    coverUrl: `https://placehold.co/1200x630/png?text=${encodeURIComponent(title)}`,
    fileUrl,
    status,
    moderationStatus,
    createdAt,
    updatedAt: createdAt,
  };
}

function buildCourseModules() {
  return [
    { id: "qa-module-course-1", productId: qaIds.course, title: "Foundation dan positioning", order: 1 },
    { id: "qa-module-course-2", productId: qaIds.course, title: "Publishing dan conversion", order: 2 },
    { id: "qa-module-partner-1", productId: qaIds.partnerCourse, title: "Analytics baseline", order: 1 },
  ];
}

function buildCourseLessons() {
  return [
    lesson("qa-lesson-hook", "qa-module-course-1", "Menulis hook untuk produk digital", "READING", 1, true, "Buat hook berbasis problem, promise, proof, dan CTA."),
    lesson("qa-lesson-video-funnel", "qa-module-course-1", "Video funnel dari konten ke checkout", "VIDEO", 2, false, null, "https://www.youtube.com/embed/dQw4w9WgXcQ"),
    lesson("qa-lesson-calendar", "qa-module-course-2", "Menyusun kalender publish 14 hari", "READING", 1, false, "Gunakan event range, status, dan format konten untuk menjaga ritme produksi."),
    lesson("qa-lesson-quiz-prep", "qa-module-course-2", "Checklist sebelum launch", "VIDEO", 2, false, null, "https://www.youtube.com/embed/dQw4w9WgXcQ"),
    lesson("qa-lesson-partner-dashboard", "qa-module-partner-1", "Membaca dashboard analytics", "READING", 1, true, "Analisis page view, click, checkout, purchase, dan lesson completion."),
  ];
}

function lesson(id, moduleId, title, type, order, isPreview, body, videoUrl = null) {
  return {
    id,
    moduleId,
    title,
    type,
    body,
    contentUrl: type === "READING" ? "https://example.com/resource.pdf" : null,
    videoUrl,
    duration: type === "VIDEO" ? 18 : 9,
    isPreview,
    order,
  };
}

function buildLessonResources() {
  return [
    resource("qa-resource-tool", "qa-lesson-hook", "TOOL", "Content Monitor", "https://content-monitor.local", "Tool utama untuk calendar, bank konten, dan produk.", 1),
    resource("qa-resource-doc", "qa-lesson-hook", "OFFICIAL_DOC", "Next.js Docs", "https://nextjs.org/docs", "Dokumentasi resmi Next.js.", 2),
    resource("qa-resource-source", "qa-lesson-video-funnel", "SOURCE", "Artikel conversion copy", "https://example.com/article", "Bacaan pendukung untuk CTA.", 1),
    resource("qa-resource-repo", "qa-lesson-calendar", "REPOSITORY", "Starter repo calendar", "https://github.com/example/calendar-starter", "Contoh starter project.", 1),
    resource("qa-resource-file", "qa-lesson-quiz-prep", "FILE", "Launch checklist PDF", "https://example.com/checklist.pdf", "File latihan untuk learner.", 1),
  ];
}

function resource(id, lessonId, type, name, url, description, order) {
  return { id, lessonId, type, name, url, description, order };
}

function buildQuizzes() {
  return [
    { id: "qa-quiz-lesson-hook", lessonId: "qa-lesson-hook", title: "Quiz hook dan CTA", passingScore: 70, maxAttempts: 3, order: 1 },
    { id: "qa-quiz-module-foundation", moduleId: "qa-module-course-1", title: "Quiz foundation", passingScore: 80, maxAttempts: 2, order: 1 },
    { id: "qa-quiz-course-final", productId: qaIds.course, title: "Final assessment", passingScore: 75, maxAttempts: 2, order: 1 },
  ];
}

function buildQuizQuestions() {
  return [
    question("qa-question-hook-1", "qa-quiz-lesson-hook", "MULTIPLE_CHOICE", "Apa tujuan utama hook?", 1, 1),
    question("qa-question-hook-2", "qa-quiz-lesson-hook", "SHORT_ANSWER", "Tulis istilah call to action dalam 3 huruf.", 2, 1),
    question("qa-question-foundation-1", "qa-quiz-module-foundation", "MULTIPLE_CHOICE", "Data mana yang wajib difilter berdasarkan owner?", 1, 1),
    question("qa-question-final-1", "qa-quiz-course-final", "MULTIPLE_CHOICE", "Event apa yang dicatat saat pembayaran berhasil?", 1, 2),
  ];
}

function question(id, quizId, type, prompt, order, points) {
  return { id, quizId, type, prompt, explanation: "Lihat materi lesson untuk pembahasan.", points, order };
}

function buildQuizOptions() {
  return [
    option("qa-option-hook-1a", "qa-question-hook-1", "Menarik perhatian dan mengaitkan problem", true, 1),
    option("qa-option-hook-1b", "qa-question-hook-1", "Mengisi jadwal tanpa tujuan", false, 2),
    option("qa-option-hook-2a", "qa-question-hook-2", "CTA", true, 1),
    option("qa-option-foundation-1a", "qa-question-foundation-1", "Semua resource milik user", true, 1),
    option("qa-option-foundation-1b", "qa-question-foundation-1", "Hanya resource yang punya slug", false, 2),
    option("qa-option-final-1a", "qa-question-final-1", "PURCHASE_COMPLETED", true, 1),
    option("qa-option-final-1b", "qa-question-final-1", "PAGE_VIEW", false, 2),
  ];
}

function option(id, questionId, label, isCorrect, order) {
  return { id, questionId, label, isCorrect, order };
}

function buildPublicPages() {
  return [
    publicPage(qaIds.creatorPage, qaIds.creator, "creator-demo", "Rina Creator", "Content system, produk digital, dan funnel edukasi.", true),
    publicPage(qaIds.buyerPage, qaIds.buyer, "buyer-demo", "Bima Buyer", "Halaman publik belum dipublish untuk skenario Appearance.", false),
    publicPage(qaIds.partnerPage, qaIds.partner, "partner-demo", "Nadia Partner", "Analytics dan measurement untuk creator.", true),
  ];
}

function publicPage(id, userId, username, displayName, bio, isPublished) {
  return {
    id,
    userId,
    username,
    displayName,
    bio,
    themeJson: JSON.stringify({ backgroundColor: "#f8fafc", textColor: "#111827", buttonStyle: "solid", fontPreset: "inter" }),
    isPublished,
  };
}

function buildPublicPageBlocks() {
  return [
    block("qa-block-creator-cta", qaIds.creatorPage, "CTA", "Booking audit konten", "https://example.com/booking", null, null, 1, true),
    block("qa-block-creator-ebook", qaIds.creatorPage, "PRODUCT", "Creator Launch Playbook", null, qaIds.ebook, null, 2, true),
    block("qa-block-creator-course", qaIds.creatorPage, "PRODUCT", "Content System Course", null, qaIds.course, null, 3, true),
    block("qa-block-creator-blog", qaIds.creatorPage, "CONTENT", "Baca checklist launch", null, null, "qa-content-blog-published", 4, true),
    block("qa-block-creator-hidden", qaIds.creatorPage, "PRODUCT", "Produk hidden", null, qaIds.draftEbook, null, 5, false),
    block("qa-block-buyer-link", qaIds.buyerPage, "LINK", "Profil LinkedIn", "https://example.com/buyer", null, null, 1, true),
    block("qa-block-partner-course", qaIds.partnerPage, "PRODUCT", "Partner Analytics Bootcamp", null, qaIds.partnerCourse, null, 1, true),
  ];
}

function block(id, publicPageId, type, title, url, productId, contentItemId, order, isVisible) {
  return {
    id,
    publicPageId,
    type,
    title,
    url,
    productId,
    contentItemId,
    configJson: JSON.stringify({ source: "qa-seed" }),
    order,
    isVisible,
  };
}

function buildOrders(dates) {
  return [
    order(qaIds.buyerCourseOrder, qaIds.creator, qaIds.buyer, qaIds.course, "Bima Buyer", qaUserEmails[1], 249000, "PAID", dates.minus2),
    order(qaIds.buyerEbookOrder, qaIds.creator, qaIds.buyer, qaIds.ebook, "Bima Buyer", qaUserEmails[1], 79000, "PAID", dates.minus1),
    order(qaIds.pendingOrder, qaIds.creator, qaIds.buyer, qaIds.course, "Bima Buyer", qaUserEmails[1], 249000, "PENDING", dates.today),
    order(qaIds.failedOrder, qaIds.creator, qaIds.buyer, qaIds.disabledProduct, "Bima Buyer", qaUserEmails[1], 99000, "FAILED", dates.minus4),
    order(qaIds.creatorPartnerOrder, qaIds.partner, qaIds.creator, qaIds.partnerCourse, "Rina Creator", qaUserEmails[0], 199000, "PAID", dates.minus3),
    order(qaIds.expiredOrder, qaIds.partner, qaIds.creator, qaIds.partnerEbook, "Rina Creator", qaUserEmails[0], 59000, "EXPIRED", dates.minus6),
  ];
}

function order(id, creatorUserId, buyerUserId, productId, buyerName, buyerEmail, amount, status, createdAt) {
  return { id, creatorUserId, buyerUserId, productId, buyerName, buyerEmail, amount, currency: "IDR", status, createdAt, updatedAt: createdAt };
}

function buildPaymentTransactions(dates) {
  return [
    transaction("qa-transaction-buyer-course-paid", qaIds.buyerCourseOrder, "MIDTRANS", "qa-midtrans-course-paid", "PAID", dates.minus2),
    transaction("qa-transaction-buyer-ebook-paid", qaIds.buyerEbookOrder, "MIDTRANS", "qa-midtrans-ebook-paid", "PAID", dates.minus1),
    transaction("qa-transaction-pending", qaIds.pendingOrder, "MIDTRANS", "qa-midtrans-pending", "PENDING", dates.today),
    transaction("qa-transaction-failed", qaIds.failedOrder, "MIDTRANS", "qa-midtrans-failed", "FAILED", dates.minus4),
    transaction("qa-transaction-creator-partner-paid", qaIds.creatorPartnerOrder, "MIDTRANS", "qa-midtrans-partner-paid", "PAID", dates.minus3),
    transaction("qa-transaction-expired", qaIds.expiredOrder, "MIDTRANS", "qa-midtrans-expired", "EXPIRED", dates.minus6),
  ];
}

function transaction(id, orderId, provider, providerReference, status, createdAt) {
  return { id, orderId, provider, providerReference, status, rawPayloadJson: JSON.stringify({ source: "qa-seed", status }), createdAt };
}

function buildEnrollments(dates) {
  return [
    { id: qaIds.buyerEnrollment, learnerUserId: qaIds.buyer, creatorUserId: qaIds.creator, productId: qaIds.course, orderId: qaIds.buyerCourseOrder, status: "ACTIVE", startedAt: dates.minus2, completedAt: null },
    { id: qaIds.creatorEnrollment, learnerUserId: qaIds.creator, creatorUserId: qaIds.partner, productId: qaIds.partnerCourse, orderId: qaIds.creatorPartnerOrder, status: "ACTIVE", startedAt: dates.minus3, completedAt: dates.minus1 },
  ];
}

function buildLessonProgress(dates) {
  return [
    progress("qa-progress-buyer-hook", qaIds.buyerEnrollment, "qa-lesson-hook", "COMPLETED", dates.minus2, dates.minus2),
    progress("qa-progress-buyer-video", qaIds.buyerEnrollment, "qa-lesson-video-funnel", "IN_PROGRESS", dates.minus1, null),
    progress("qa-progress-creator-partner", qaIds.creatorEnrollment, "qa-lesson-partner-dashboard", "COMPLETED", dates.minus3, dates.minus1),
  ];
}

function progress(id, enrollmentId, lessonId, status, startedAt, completedAt) {
  return { id, enrollmentId, lessonId, status, startedAt, completedAt };
}

function buildQuizAttempts(dates) {
  return [
    {
      id: "qa-attempt-buyer-hook-passed",
      enrollmentId: qaIds.buyerEnrollment,
      quizId: "qa-quiz-lesson-hook",
      score: 100,
      passed: true,
      answersJson: JSON.stringify([
        { questionId: "qa-question-hook-1", optionId: "qa-option-hook-1a", answerText: null, isCorrect: true, points: 1, maxPoints: 1 },
        { questionId: "qa-question-hook-2", optionId: null, answerText: "CTA", isCorrect: true, points: 1, maxPoints: 1 },
      ]),
      startedAt: dates.minus1,
      submittedAt: dates.minus1,
    },
  ];
}

function buildAnalyticsEvents(dates) {
  const events = [
    analytics("qa-analytics-page-1", qaIds.creator, qaIds.creatorPage, null, null, "PAGE_VIEW", dates.minus7),
    analytics("qa-analytics-page-2", qaIds.creator, qaIds.creatorPage, null, null, "PAGE_VIEW", dates.minus6),
    analytics("qa-analytics-link-1", qaIds.creator, qaIds.creatorPage, "qa-block-creator-cta", null, "LINK_CLICK", dates.minus6),
    analytics("qa-analytics-product-1", qaIds.creator, qaIds.creatorPage, "qa-block-creator-course", qaIds.course, "PRODUCT_CLICK", dates.minus5),
    analytics("qa-analytics-checkout-1", qaIds.creator, null, null, qaIds.course, "CHECKOUT_STARTED", dates.minus2),
    analytics("qa-analytics-purchase-1", qaIds.creator, null, null, qaIds.course, "PURCHASE_COMPLETED", dates.minus2),
    analytics("qa-analytics-purchase-2", qaIds.creator, null, null, qaIds.ebook, "PURCHASE_COMPLETED", dates.minus1),
    analytics("qa-analytics-course-started", qaIds.creator, null, null, qaIds.course, "COURSE_STARTED", dates.minus2),
    analytics("qa-analytics-lesson-completed", qaIds.creator, null, null, qaIds.course, "LESSON_COMPLETED", dates.minus2),
    analytics("qa-analytics-quiz", qaIds.creator, null, null, qaIds.course, "QUIZ_SUBMITTED", dates.minus1),
  ];

  return events.map((event, index) => ({
    ...event,
    visitorId: `qa-visitor-${index + 1}`,
    ipHash: `qa-ip-${index + 1}`,
    metadataJson: JSON.stringify({ source: "qa-seed", orderId: index > 4 ? qaIds.buyerCourseOrder : null }),
  }));
}

function analytics(id, userId, publicPageId, blockId, productId, type, createdAt) {
  return { id, userId, publicPageId, blockId, productId, type, createdAt };
}

function buildAdminAuditLogs(adminId, dates) {
  return [
    audit("qa-audit-platform-settings", adminId, null, null, "PLATFORM_SETTINGS_UPDATED", { paymentMode: "SANDBOX" }, dates.minus5),
    audit("qa-audit-user-inactive", adminId, qaIds.inactive, null, "USER_STATUS_UPDATED", { status: "INACTIVE" }, dates.minus4),
    audit("qa-audit-product-disabled", adminId, null, qaIds.disabledProduct, "PRODUCT_MODERATION_UPDATED", { moderationStatus: "DISABLED" }, dates.minus3),
  ];
}

function audit(id, actorUserId, targetUserId, targetProductId, action, metadata, createdAt) {
  return { id, actorUserId, targetUserId, targetProductId, action, metadataJson: JSON.stringify(metadata), createdAt };
}

function buildDates(now) {
  return {
    today: at(now, 0, 9, 0),
    tomorrow10: at(now, 1, 10, 0),
    tomorrow11: at(now, 1, 11, 0),
    plus2AllDay: at(now, 2, 0, 0),
    plus4AllDay: at(now, 4, 0, 0),
    plus6: at(now, 6, 14, 0),
    plus6End: at(now, 6, 15, 30),
    minus1: at(now, -1, 9, 0),
    minus2: at(now, -2, 10, 0),
    minus3: at(now, -3, 11, 0),
    minus4: at(now, -4, 12, 0),
    minus5: at(now, -5, 13, 0),
    minus6: at(now, -6, 14, 0),
    minus7: at(now, -7, 15, 0),
    minus8: at(now, -8, 16, 0),
    minus9: at(now, -9, 17, 0),
    minus10: at(now, -10, 18, 0),
    minus20: at(now, -20, 8, 0),
  };
}

function at(now, dayOffset, hour, minute) {
  const date = new Date(now);
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date;
}

module.exports = {
  seedQaScenario,
  qaUserEmails,
};
