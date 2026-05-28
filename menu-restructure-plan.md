# Rencana Perombakan Struktur Menu Content Monitor

Dokumen ini menjadi rancangan awal untuk mengubah `content-monitor` dari dashboard perencanaan konten sederhana menjadi aplikasi creator dashboard yang memiliki kalender konten, bank konten, produk digital, halaman publik seperti Lynk.id, statistik, payment, dan autentikasi.

## Tujuan Produk

Content Monitor akan diarahkan menjadi aplikasi untuk creator atau pemilik produk digital yang ingin:

- Menjadwalkan publikasi konten dalam bentuk kalender.
- Menyimpan dan mengelola aset konten berdasarkan format.
- Menjual produk digital seperti e-book dan course.
- Membuat halaman publik/direct link yang bisa dikustom dari preview mobile.
- Melihat performa klik, pembelian, dan konversi.
- Mengelola pembayaran, akun, dan data pengguna secara aman.

## Kondisi Project Saat Ini

Project saat ini memakai:

- Next.js App Router.
- Prisma + SQLite lokal.
- Tailwind CSS, shadcn/ui style components, Radix primitives, dan lucide-react.
- Satu halaman utama di `app/page.jsx`.
- Komponen dashboard utama di `components/content-dashboard.jsx`.
- Data dashboard dari `lib/content-data.js`.
- Checklist progres masih disimpan di `localStorage`.

Implikasi refactor:

- UI perlu dipisah menjadi layout dashboard dan halaman per modul.
- Data perlu dibuat multi-user setelah auth tersedia.
- Struktur database perlu diperluas dari topik/timeline lama menjadi konten, events, produk, halaman publik, event tracking, order, dan payment.

## Keputusan Arsitektur MVP

Course dimasukkan ke ekosistem aplikasi yang sama, bukan dibuat sebagai aplikasi terpisah di fase awal.

Alasannya:

- Course, produk, checkout, ownership creator, enrollment pembeli, quiz, progress belajar, dan statistik saling terkait.
- Jika course dibuat sebagai aplikasi terpisah sejak awal, sistem perlu menyelesaikan SSO, sinkronisasi payment, sinkronisasi akses course, dan statistik lintas aplikasi terlalu cepat.
- Dengan satu ekosistem, user creator bisa membuat course dan menjualnya dari dashboard yang sama.
- Pembeli course tetap mendapat pengalaman belajar terpisah melalui Learner Area.

Pembagian experience:

```text
User Dashboard
|-- Mengelola konten
|-- Mengelola produk digital
|-- Membuat course, lesson, quiz, resource, dan tools
|-- Mengatur halaman publik
|-- Melihat statistik
`-- Mengatur payment dan akun

Learner Area
|-- Mengakses course yang sudah dibeli
|-- Mengikuti module dan lesson
|-- Menonton video atau membaca materi
|-- Mengerjakan quiz
|-- Melihat progress belajar
`-- Membuka tools, dokumentasi resmi, dan resource pendukung

Admin Area
|-- Mengelola user
|-- Mengelola produk/course bermasalah
|-- Moderasi konten publik
|-- Monitoring order dan payment
|-- Mengatur konfigurasi aplikasi
`-- Melihat statistik platform
```

Role aplikasi dibuat sederhana:

- `ADMIN`: pengelola platform/aplikasi secara global.
- `USER`: pengguna biasa yang bisa membuat produk/course/event konten sendiri dan juga membeli produk milik user lain.

Tidak ada role creator dan learner terpisah di MVP. Status creator atau learner ditentukan oleh aktivitas dan data:

- User menjadi creator ketika membuat konten, produk, course, atau halaman publik.
- User menjadi learner/buyer ketika membeli produk atau memiliki enrollment course.

## Struktur Menu Target

```text
Dashboard
|-- Events
|-- Bank Konten
|   |-- Video Short
|   |-- Carousel Post
|   |-- Blog
|   `-- Long Video
|-- Produk
|   |-- E-book
|   `-- Course
|-- Appearance
|-- Statistics
|-- Payment
`-- Account
```

## Rancangan Route

Struktur route yang disarankan:

```text
app/
|-- (auth)/
|   |-- login/page.jsx
|   |-- register/page.jsx
|   |-- forgot-password/page.jsx
|   `-- reset-password/page.jsx
|-- (dashboard)/
|   |-- layout.jsx
|   |-- events/page.jsx
|   |-- bank-konten/
|   |   |-- video-short/page.jsx
|   |   |-- carousel-post/page.jsx
|   |   |-- blog/page.jsx
|   |   `-- long-video/page.jsx
|   |-- produk/
|   |   |-- e-book/page.jsx
|   |   `-- course/page.jsx
|   |-- appearance/page.jsx
|   |-- statistics/page.jsx
|   |-- payment/page.jsx
|   `-- account/page.jsx
|-- (learner)/
|   |-- learn/page.jsx
|   `-- learn/[course-slug]/page.jsx
|-- admin/
|   |-- layout.jsx
|   |-- users/page.jsx
|   |-- content/page.jsx
|   |-- products/page.jsx
|   |-- orders/page.jsx
|   |-- payments/page.jsx
|   |-- settings/page.jsx
|   `-- statistics/page.jsx
|-- [username]/page.jsx
|-- [username]/course/[course-slug]/page.jsx
`-- api/
    |-- auth/[...nextauth]/route.js
    |-- courses/
    |   |-- enrollments/route.js
    |   `-- quiz-attempts/route.js
    |-- events/route.js
    |-- payment/
    |   |-- checkout/route.js
    |   `-- webhook/route.js
    `-- public-page/[username]/route.js
```

Catatan:

- `app/(dashboard)/layout.jsx` menjadi shell utama dashboard: sidebar, header, user menu, dan guard auth.
- `app/(learner)/learn/*` menjadi area belajar untuk pembeli course.
- `app/admin/*` menjadi area admin platform dan hanya bisa diakses role `ADMIN`.
- `app/[username]/page.jsx` menjadi halaman publik/direct link seperti contoh Lynk.id.
- `app/[username]/course/[course-slug]/page.jsx` menjadi halaman sales/detail course publik.
- `app/page.jsx` bisa diarahkan ke `/events` jika user sudah login, atau ke `/login` jika belum.

## Detail Modul

### 1. Events

Tujuan:

- Menampilkan jadwal konten/event seperti Google Calendar.
- Menampilkan konten berdasarkan tanggal publish, status, dan format konten.

Fitur awal:

- Tampilan month/week/list.
- Tampilan year sebagai ringkasan kalender tahunan.
- Event konten dengan warna berdasarkan format.
- Klik tanggal atau drag rentang tanggal membuka modal tambah event.
- Klik event membuka modal detail/edit event.
- Event multi-hari ditampilkan sebagai kotak/bar yang mengikuti rentang tanggal.
- List view menampilkan event dalam urutan tanggal untuk layar kecil atau kebutuhan scanning cepat.
- Drag-and-drop bisa masuk fase berikutnya, bukan MVP pertama.
- Filter berdasarkan format: Video Short, Carousel Post, Blog, Long Video.
- Status: Draft, Scheduled, Published, Archived.

Data utama:

- `ContentItem.scheduledAt`
- `ContentItem.status`
- `ContentItem.type`
- `ContentItem.title`

### 2. Bank Konten

Bank Konten menggantikan konsep `Bank Topik` lama dan dibagi berdasarkan format.

#### Video Short

Fitur:

- Judul/hook.
- Script pendek.
- Platform target: TikTok, Instagram Reels, YouTube Shorts, LinkedIn.
- CTA.
- Status produksi.
- Upload/link asset video.

#### Carousel Post

Fitur:

- Judul carousel.
- Outline slide.
- Caption.
- Platform target.
- CTA.
- Status desain/copywriting.

#### Blog

Fitur:

- Judul artikel.
- Slug.
- Draft body.
- SEO title/description.
- Keyword.
- Status publish.

#### Long Video

Fitur:

- Judul video.
- Outline/chapters.
- Script.
- Thumbnail.
- Platform target: YouTube, course lesson, atau embed.

### 3. Produk

#### E-book

Fitur:

- Nama produk.
- Deskripsi.
- Harga.
- Cover image.
- Upload file e-book.
- Preview atau viewer file e-book.
- Download file setelah pembelian berhasil.
- Status aktif/nonaktif.
- Product page detail.

#### Course

Fitur:

- Nama course.
- Deskripsi.
- Harga.
- Modul dan lesson.
- Upload materi course.
- Lesson bisa berbentuk bacaan atau video.
- Viewer bacaan untuk lesson berbasis teks/file.
- Video player atau embed untuk lesson berbasis video.
- File pendukung per lesson.
- Quiz untuk tiap course, module, atau lesson.
- Question bank sederhana untuk pilihan ganda dan jawaban singkat.
- Passing score dan batas percobaan quiz.
- Tools yang digunakan dalam course.
- Dokumentasi resmi untuk setiap tools.
- Resource pendukung seperti artikel, repository, template, atau file latihan.
- Status aktif/nonaktif.

Data produk perlu dipisah dari konten biasa karena akan terhubung ke checkout, order, dan statistik pembelian.

#### Course Builder

Course builder adalah bagian dari dashboard creator untuk menyusun course sebelum dijual.

Fitur MVP:

- Struktur module dan lesson dengan urutan yang bisa diatur.
- Lesson type: `READING` atau `VIDEO`.
- Editor materi bacaan.
- Upload/link video untuk lesson video.
- Upload file pendukung.
- Resource list per lesson:
  - Tool.
  - Dokumentasi resmi.
  - Sumber bacaan tambahan.
  - Repository atau starter project.
- Quiz builder per lesson/module/course.
- Preview course sebagai learner.
- Publish/unpublish course.

#### Learner Area

Learner Area adalah area untuk pembeli course setelah pembayaran berhasil.

Fitur MVP:

- Daftar course yang sudah dibeli.
- Halaman belajar course.
- Sidebar module dan lesson.
- Lesson viewer untuk bacaan dan video.
- Checklist/progress lesson.
- Quiz attempt.
- Skor quiz.
- Status lulus/belum lulus berdasarkan passing score.
- Resource/tools section di dalam lesson.
- Akses hanya untuk user yang punya enrollment aktif.

Flow pembeli course:

```text
Pembeli membuka halaman course publik
|-- Klik beli
|-- Checkout
|-- Payment berhasil
|-- Sistem membuat Enrollment
|-- Pembeli masuk ke Learner Area
|-- Pembeli mengikuti lesson
|-- Pembeli mengerjakan quiz
`-- Progress dan skor tersimpan
```

### 4. Appearance

Modul ini menjadi builder halaman publik. Referensi arahnya seperti Lynk.id: user bisa mengatur tampilan halaman mobile-first dan membagikan direct link publik.

Fitur awal:

- Preview mobile di sisi kanan atau tengah.
- Editor tampilan di sisi kiri.
- Public URL: `/{username}`.
- Profile section: avatar, nama display, bio, social links.
- Link/product blocks:
  - Link biasa.
  - Produk e-book.
  - Produk course.
  - Blog/content highlight.
  - Custom CTA.
- Theme:
  - Background color.
  - Text color.
  - Button style.
  - Font preset.
  - Block order.
- Publish/unpublish halaman.

Fitur lanjutan:

- Template tampilan.
- Custom domain.
- Pixel tracking.
- Embed video.
- Featured product.

### 5. Statistics

Tujuan:

- Menampilkan performa konten, produk, dan halaman publik.

Metric awal:

- Total page views halaman publik.
- Total klik per block/link.
- Total checkout dimulai.
- Total pembelian berhasil.
- Conversion rate dari klik ke pembelian.
- Revenue kotor.
- Produk paling sering diklik.
- Produk paling banyak dibeli.
- Course enrollment.
- Lesson completion rate.
- Quiz completion rate.
- Rata-rata skor quiz.
- Lesson dengan drop-off tertinggi.

Event tracking awal:

- `PAGE_VIEW`
- `LINK_CLICK`
- `PRODUCT_CLICK`
- `CHECKOUT_STARTED`
- `PURCHASE_COMPLETED`
- `COURSE_STARTED`
- `LESSON_COMPLETED`
- `QUIZ_SUBMITTED`

### 6. Payment

Payment sebaiknya dibuat dengan abstraction layer agar bisa memilih Midtrans atau Xendit tanpa mengunci arsitektur.

Fitur awal:

- Halaman konfigurasi provider.
- Provider mode: disabled, sandbox, production.
- Checkout untuk produk digital.
- Webhook handler.
- Order status:
  - Pending
  - Paid
  - Failed
  - Expired
  - Refunded

Pertimbangan Midtrans vs Xendit:

- Midtrans umum untuk e-commerce Indonesia dan integrasi payment page.
- Xendit kuat untuk invoice/payment link dan API payment yang fleksibel.
- Keputusan final bisa ditunda, tetapi schema `PaymentProvider`, `Order`, dan `PaymentTransaction` harus dibuat netral dari awal.

Rekomendasi sementara:

- Gunakan Midtrans untuk MVP jika fokus awal adalah jual e-book dan course ke market Indonesia lewat checkout di aplikasi.
- Tetap buat `paymentProvider` abstraction agar Xendit bisa ditambahkan tanpa mengubah flow produk dan order.
- Pertimbangkan Xendit jika kebutuhan utama berubah ke payment link/invoice cepat, recurring/subscription, payout, atau ekspansi lintas negara.

### 7. Account

Fitur:

- Profile user.
- Username publik.
- Email.
- Password/security.
- Upload avatar.
- Timezone.
- Logout.
- Pengaturan notifikasi sederhana.

### 8. Admin Area

Admin Area adalah modul khusus untuk pengelola aplikasi. Area ini tidak dipakai untuk membuat konten pribadi, tetapi untuk menjaga operasional platform.

Fitur MVP:

- User management:
  - Melihat daftar user.
  - Mengubah status user aktif/nonaktif.
  - Melihat detail aktivitas dasar user.
- Content moderation:
  - Melihat halaman publik user.
  - Menandai produk/course/konten yang perlu ditinjau.
  - Menonaktifkan produk atau halaman publik jika melanggar aturan.
- Order dan payment monitoring:
  - Melihat order lintas platform.
  - Melihat status transaksi.
  - Membantu investigasi pembayaran gagal.
- Platform settings:
  - Konfigurasi payment provider global.
  - Konfigurasi fee platform jika nanti dibutuhkan.
  - Pengaturan batas upload dan tipe file.
- Platform statistics:
  - Total user.
  - Total creator aktif.
  - Total produk aktif.
  - Total order.
  - Total revenue platform.

Catatan:

- Admin tidak otomatis menjadi pemilik data user.
- Admin boleh melihat dan menonaktifkan data untuk kebutuhan operasional/moderasi.
- Semua aksi admin yang mengubah status data sebaiknya dicatat di audit log pada fase lanjutan.

## Autentikasi

Autentikasi perlu masuk sebelum modul produk, appearance, payment, dan statistics dipakai serius.

Rekomendasi:

- Gunakan Auth.js/NextAuth dengan Prisma Adapter.
- Login awal via email + password.
- Session guard untuk semua route dashboard.
- Role hanya `ADMIN` dan `USER`.
- Halaman publik `/{username}` tetap bisa diakses tanpa login.
- Data wajib selalu difilter berdasarkan `userId`.

Flow auth:

```text
Guest
|-- /login
|-- /register
|-- /forgot-password
`-- /{username} public page

Authenticated User
|-- /events
|-- /bank-konten/*
|-- /produk/*
|-- /appearance
|-- /statistics
|-- /payment
|-- /account
`-- /learn/*

Admin
|-- /admin/users
|-- /admin/content
|-- /admin/products
|-- /admin/orders
|-- /admin/payments
|-- /admin/settings
`-- /admin/statistics
```

Access control:

- User hanya bisa mengelola course, produk, event, konten, dan statistik miliknya sendiri.
- User bisa membeli produk milik user lain.
- User pembeli hanya bisa membuka course jika memiliki `Enrollment` aktif.
- Admin bisa mengakses `/admin/*` untuk mengelola aplikasi secara global.
- Route `/admin/*` wajib ditolak untuk role `USER`.
- Halaman publik `/{username}` dan `/{username}/course/{course-slug}` bisa dibuka tanpa login.
- Checkout bisa dimulai dari halaman publik, tetapi akses learner membutuhkan akun pembeli.

## Rancangan Database Awal

Model konseptual:

```text
User
|-- id
|-- name
|-- email
|-- passwordHash
|-- role: ADMIN | USER
|-- username
|-- avatarUrl
|-- bio
|-- timezone
`-- createdAt

ContentItem
|-- id
|-- userId
|-- type: VIDEO_SHORT | CAROUSEL_POST | BLOG | LONG_VIDEO
|-- title
|-- slug
|-- body
|-- metadataJson
|-- status: DRAFT | SCHEDULED | PUBLISHED | ARCHIVED
|-- scheduledAt
|-- publishedAt
`-- createdAt

Product
|-- id
|-- userId
|-- type: EBOOK | COURSE
|-- title
|-- slug
|-- description
|-- price
|-- currency
|-- coverUrl
|-- fileUrl
|-- status: DRAFT | ACTIVE | INACTIVE
`-- createdAt

CourseModule
|-- id
|-- productId
|-- title
`-- order

CourseLesson
|-- id
|-- moduleId
|-- title
|-- type: READING | VIDEO
|-- body
|-- contentUrl
|-- videoUrl
|-- duration
|-- isPreview
`-- order

LessonResource
|-- id
|-- lessonId
|-- type: TOOL | OFFICIAL_DOC | SOURCE | REPOSITORY | FILE
|-- name
|-- url
|-- description
`-- order

Quiz
|-- id
|-- productId
|-- moduleId
|-- lessonId
|-- title
|-- passingScore
|-- maxAttempts
`-- order

QuizQuestion
|-- id
|-- quizId
|-- type: MULTIPLE_CHOICE | SHORT_ANSWER
|-- prompt
|-- explanation
|-- points
`-- order

QuizAnswerOption
|-- id
|-- questionId
|-- label
|-- isCorrect
`-- order

Enrollment
|-- id
|-- learnerUserId
|-- creatorUserId
|-- productId
|-- orderId
|-- status: ACTIVE | EXPIRED | REVOKED
|-- startedAt
`-- completedAt

LessonProgress
|-- id
|-- enrollmentId
|-- lessonId
|-- status: NOT_STARTED | IN_PROGRESS | COMPLETED
|-- startedAt
`-- completedAt

QuizAttempt
|-- id
|-- enrollmentId
|-- quizId
|-- score
|-- passed
|-- answersJson
|-- startedAt
`-- submittedAt

PublicPage
|-- id
|-- userId
|-- username
|-- displayName
|-- bio
|-- themeJson
|-- isPublished
`-- updatedAt

PublicPageBlock
|-- id
|-- publicPageId
|-- type: LINK | PRODUCT | CONTENT | CTA
|-- title
|-- url
|-- productId
|-- contentItemId
|-- configJson
|-- order
`-- isVisible

AnalyticsEvent
|-- id
|-- userId
|-- publicPageId
|-- blockId
|-- productId
|-- type
|-- metadataJson
|-- visitorId
|-- createdAt
`-- ipHash

Order
|-- id
|-- creatorUserId
|-- buyerUserId
|-- productId
|-- buyerEmail
|-- buyerName
|-- amount
|-- currency
|-- status
`-- createdAt

PaymentTransaction
|-- id
|-- orderId
|-- provider: MIDTRANS | XENDIT
|-- providerReference
|-- status
|-- rawPayloadJson
`-- createdAt
```

## Rencana Implementasi Bertahap

### Fase 1: Struktur Dashboard dan Menu

Target:

- Pecah `components/content-dashboard.jsx` menjadi dashboard layout dan halaman per modul.
- Buat sidebar baru sesuai struktur menu target.
- Buat placeholder page untuk semua modul.
- Redirect `/` ke route utama.

Output:

- `app/(dashboard)/layout.jsx`
- `components/dashboard/sidebar.jsx`
- `app/(dashboard)/events/page.jsx`
- Semua page placeholder untuk Bank Konten, Produk, Appearance, Statistics, Payment, Account.

### Fase 2: Auth dan Ownership Data

Target:

- Tambahkan model user dan auth.
- Tambahkan role `ADMIN` dan `USER`.
- Tambahkan halaman login/register.
- Proteksi route dashboard.
- Proteksi route admin.
- Semua data dashboard mulai memakai `userId`.

Output:

- Auth.js/NextAuth setup.
- Prisma schema auth.
- Route guard.
- Admin route guard.
- Session-aware dashboard.

### Fase 3: Bank Konten Baru

Target:

- Migrasi konsep topik/timeline lama ke `ContentItem`.
- Buat CRUD sederhana untuk tiap format.
- Tambahkan filter status, search, dan scheduled date.

Output:

- Halaman Video Short, Carousel Post, Blog, Long Video.
- Form create/edit content.
- Content list per format.

### Fase 4: Events Calendar

Target:

- Events menjadi calendar view.
- Event berasal dari `ContentItem.scheduledAt`.
- Klik event membuka detail.
- Klik tanggal atau pilih rentang tanggal membuka modal tambah event.
- Event multi-hari tampil sebagai kotak/bar berdasarkan rentang tanggal.
- Sediakan month, week, year, dan list view.

Output:

- Month calendar.
- Week/list fallback.
- Filter format dan status.

### Fase 5: Produk Digital

Target:

- CRUD e-book dan course.
- File/link product.
- Status publish produk.
- Produk bisa muncul sebagai block di Appearance.
- Course memiliki module dan lesson dasar.

Output:

- Halaman E-book.
- Halaman Course.
- Model Product, CourseModule, CourseLesson.
- Upload dan viewer untuk file e-book.
- Lesson course berbasis bacaan dan video.

### Fase 6: Course Builder dan Quiz Authoring

Target:

- Creator bisa menyusun course seperti platform pembelajaran.
- Creator bisa membuat quiz untuk course, module, atau lesson.
- Tools dan dokumentasi resmi bisa dicatat per lesson.

Output:

- Course builder untuk module, lesson, resource, dan quiz.
- Resource/tools section per lesson.
- Quiz builder dan question bank sederhana.
- Preview course sebagai creator.

### Fase 7: Appearance, Public Page, dan Course Sales Page

Target:

- Builder tampilan mobile-first.
- Public page `/{username}`.
- Link/product blocks bisa diurutkan.
- Theme sederhana.
- Course dan produk bisa muncul sebagai block publik.
- Halaman detail course publik tersedia.

Output:

- Editor Appearance.
- Mobile preview.
- Public page renderer.
- Public course detail page.
- Tracking awal untuk page view dan click.

### Fase 8: Payment dan Enrollment

Target:

- Buat abstraction payment provider.
- Integrasi provider pertama: Midtrans atau Xendit.
- Checkout produk.
- Webhook update order.
- Membuat enrollment otomatis ketika order course sudah paid.

Output:

- Checkout endpoint.
- Webhook endpoint.
- Payment settings.
- Order lifecycle.
- Enrollment creation flow.

### Fase 9: Learner Area, Progress, dan Quiz Attempt

Target:

- Pembeli course bisa mengikuti alur belajar setelah membeli.
- Akses course dikontrol oleh enrollment.
- Progress lesson tersimpan.
- Quiz bisa dikerjakan dan dinilai.

Output:

- Learner area `/learn/[course-slug]`.
- Lesson progress.
- Quiz attempt dan scoring.
- Course completion state.

### Fase 10: Statistics

Target:

- Dashboard statistik dari `AnalyticsEvent`, `Order`, dan `PaymentTransaction`.
- Report klik, pembelian, conversion rate, dan revenue.
- Report enrollment, progress lesson, dan quiz score.

Output:

- Summary metric.
- Chart sederhana.
- Table performa produk/link.
- Table performa course dan quiz.

### Fase 11: Admin Area

Target:

- Admin bisa mengelola operasional aplikasi secara global.
- Admin bisa melihat user, produk, course, order, payment, dan statistik platform.
- Admin bisa menonaktifkan user atau produk yang bermasalah.

Output:

- Route `/admin/*`.
- Admin layout dan sidebar.
- User management.
- Product/course moderation.
- Order/payment monitoring.
- Platform settings placeholder.
- Platform statistics.

## Prioritas MVP

Urutan yang paling aman:

1. Struktur menu dan route dashboard.
2. Auth.
3. Bank Konten berbasis `ContentItem`.
4. Events calendar.
5. Produk e-book/course.
6. Course builder dan quiz authoring.
7. Appearance + public page + course sales page.
8. Payment gateway dan enrollment otomatis.
9. Learner area, progress belajar, dan quiz attempt.
10. Statistik click/page view/course progress.
11. Admin area untuk pengelolaan platform.

Alasannya: payment butuh ownership data, produk, course structure, dan public sales page yang sudah stabil. Statistik diletakkan setelah learner flow karena metrik course baru bermakna ketika enrollment, progress, dan quiz attempt sudah berjalan.

MVP course minimum:

- Creator bisa membuat course.
- Creator bisa membuat module dan lesson.
- Lesson bisa berupa bacaan atau video.
- Creator bisa menambahkan tools dan dokumentasi resmi.
- Creator bisa membuat quiz sederhana.
- Pembeli yang sudah punya enrollment bisa mengakses course.
- Progress lesson dan skor quiz tersimpan.

## Catatan Desain UI

- Dashboard utama sebaiknya tetap utilitarian: sidebar jelas, konten padat, banyak table/list/filter.
- Appearance boleh lebih visual karena sifatnya builder.
- Public page harus mobile-first karena direct link biasanya dibuka dari sosial media.
- Events calendar perlu punya fallback list view untuk layar mobile.
- Produk dan Bank Konten sebaiknya memakai pola UI yang konsisten: list, filter, status badge, create/edit form.
- Course builder perlu terasa seperti editor kerja: struktur module/lesson di kiri, form lesson di tengah, dan preview/resource di sisi kanan jika layar cukup.
- Learner area perlu fokus dan minim distraksi: sidebar progress, viewer materi, tombol next/previous, quiz, dan resource.
- Quiz harus jelas membedakan mode belum dikerjakan, sedang dikerjakan, sudah submit, lulus, dan belum lulus.

## Risiko dan Keputusan yang Masih Terbuka

- Provider payment final belum dipilih: Midtrans atau Xendit.
- Perlu keputusan apakah file digital disimpan lokal, S3-compatible storage, Cloudinary, atau provider lain.
- Perlu keputusan apakah public page memakai custom domain di fase awal atau nanti.
- Perlu keputusan apakah file produk disimpan lokal untuk MVP atau langsung memakai object storage.
- Perlu keputusan apakah course video hanya link/embed dulu atau sudah upload dan lesson player lengkap.
- Perlu keputusan apakah quiz MVP cukup pilihan ganda dan jawaban singkat, atau perlu tipe soal lain.
- Perlu keputusan apakah sertifikat course masuk MVP atau fase lanjutan.
- Perlu strategi akses file agar e-book dan materi course tidak bisa dibuka tanpa enrollment/order paid.
- Perlu keputusan kapan admin audit log mulai diwajibkan.
- Perlu keputusan apakah admin bisa melakukan refund dari dashboard atau hanya monitoring dahulu.
- Perlu follow-up dependency audit untuk vulnerability transitive pada Prisma/Next/NextAuth ketika versi patch yang aman tersedia tanpa downgrade/breaking change.
- Perlu strategi migrasi data lama dari `Topic` dan `TimelineWeek` ke `ContentItem`.

## Langkah Teknis Berikutnya

Langkah implementasi pertama yang disarankan:

1. Buat route group `(dashboard)` dan layout dashboard.
2. Pindahkan sidebar dari `ContentDashboard` menjadi komponen reusable.
3. Buat menu sesuai struktur baru.
4. Pecah `TimelineView` lama ke halaman `events`.
5. Ubah `TopicView` lama menjadi halaman awal `bank-konten` atau migrasikan menjadi placeholder Bank Konten.
6. Tambahkan placeholder untuk Produk, Appearance, Statistics, Payment, dan Account.
7. Tambahkan placeholder Learner Area `/learn`.
8. Tambahkan placeholder Admin Area `/admin`.
9. Setelah struktur UI stabil, masuk ke auth dan schema database baru.
10. Implementasikan role guard untuk `ADMIN` dan `USER`.
11. Implementasikan Product dan Course schema sebelum payment.
12. Implementasikan Enrollment dan Quiz sebelum statistik course.

## Standar Arsitektur dan Kualitas Kode

### tRPC sebagai Gerbang API

Backend aplikasi memakai tRPC sebagai gerbang utama API.

Prinsip:

- Semua komunikasi client ke backend internal melewati tRPC.
- Route handler Next.js dipakai sebagai gateway tRPC, bukan tempat logic bisnis.
- Logic bisnis tiap endpoint dipisah ke file `.ts` sesuai domain.
- File route tRPC hanya melakukan wiring router, context, dan adapter.
- Endpoint eksternal khusus seperti payment webhook tetap boleh memakai route handler Next.js karena dipanggil pihak ketiga, tetapi logic-nya tetap dipindah ke service `.ts`.

Struktur yang disarankan:

```text
server/
|-- trpc/
|   |-- context.ts
|   |-- root.ts
|   |-- router.ts
|   `-- procedures.ts
|-- modules/
|   |-- events/
|   |   |-- events.router.ts
|   |   |-- events.service.ts
|   |   |-- events.repository.ts
|   |   |-- events.schema.ts
|   |   `-- events.policy.ts
|   |-- products/
|   |-- courses/
|   |-- payments/
|   |-- appearance/
|   |-- statistics/
|   `-- admin/
`-- shared/
    |-- errors.ts
    |-- pagination.ts
    `-- validation.ts
```

Contoh route:

```text
app/api/trpc/[trpc]/route.ts
```

### Batas Ukuran File

Aturan ukuran file:

- File backend maksimal 500 baris.
- File frontend maksimal 1000 baris.
- Jika mendekati batas, pecah sebelum melewati batas.
- File page hanya menyusun layout dan data entry point, bukan menampung semua UI.
- Logic bisnis tidak ditempatkan di komponen React.

Strategi pemecahan:

- Backend dipisah menjadi router, service, repository, schema, policy, dan adapter.
- Frontend dipisah menjadi page, view component, section component, form component, table/list component, dialog/modal, dan shared UI.
- Hook state kompleks dipisah ke file `use-*.ts`.

### Standar Frontend Component

Prinsip:

- Buat component terlebih dahulu sebelum slicing ke halaman-halaman.
- Komponen yang dipakai berulang wajib punya tempat pengaturan variant.
- Variant UI memakai pola yang konsisten, misalnya `class-variance-authority`.
- Page tidak boleh berisi UI besar langsung.
- Komponen domain disimpan berdasarkan modul.
- Komponen shared disimpan di folder shared/common.

Struktur yang disarankan:

```text
components/
|-- ui/
|-- layout/
|-- shared/
|-- events/
|-- content-bank/
|-- products/
|-- courses/
|-- appearance/
|-- learner/
`-- admin/
```

Contoh penempatan:

```text
components/courses/course-card.tsx
components/courses/course-form.tsx
components/courses/course-builder-shell.tsx
components/courses/lesson-resource-list.tsx
components/shared/status-badge.tsx
components/shared/data-table.tsx
```

### Konsistensi Penamaan File

Aturan penamaan:

- Semua nama file memakai kebab-case.
- Component React memakai PascalCase di export, tetapi nama file tetap kebab-case.
- File router tRPC memakai format `domain.router.ts`.
- File service memakai format `domain.service.ts`.
- File repository memakai format `domain.repository.ts`.
- File validation/schema memakai format `domain.schema.ts`.
- File policy/authorization memakai format `domain.policy.ts`.
- Hook memakai format `use-*.ts`.
- Test memakai format `*.test.ts` atau `*.test.tsx`.

Contoh:

```text
courses.router.ts
courses.service.ts
courses.repository.ts
courses.schema.ts
courses.policy.ts
course-builder-shell.tsx
use-course-builder.ts
```

### Security Baseline

Keamanan harus menjadi bagian dari implementasi awal, bukan ditambahkan belakangan.

Checklist keamanan:

- Semua mutation tRPC wajib validasi input.
- Gunakan schema validation untuk input, misalnya Zod.
- Semua query/mutation data user wajib cek ownership.
- Route admin wajib cek role `ADMIN`.
- Route learner wajib cek enrollment.
- Jangan percaya `userId` dari client; ambil dari session server.
- Payment webhook wajib verifikasi signature/provider payload.
- File upload wajib validasi MIME type, ekstensi, ukuran, dan ownership.
- File digital private tidak boleh dibuka dengan URL publik tanpa authorization.
- Jangan simpan secret di client.
- Jangan log password, token, payment payload sensitif, atau file private URL.
- Tambahkan rate limiting untuk auth, checkout, public tracking, dan mutation sensitif.
- Tambahkan audit log untuk aksi admin pada fase lanjutan.
- Gunakan error message yang tidak membocorkan detail internal.

### Prinsip SOLID

Implementasi wajib mengikuti SOLID secara pragmatis:

- Single Responsibility: router hanya routing, service logic bisnis, repository akses data, policy authorization.
- Open/Closed: payment provider dibuat adapter agar Midtrans/Xendit bisa ditambah tanpa ubah flow order utama.
- Liskov Substitution: adapter provider harus punya contract yang konsisten.
- Interface Segregation: pisahkan contract kecil untuk payment, storage, analytics, dan notification.
- Dependency Inversion: service bergantung pada interface/adapter, bukan langsung pada implementasi provider eksternal.

Contoh penerapan:

- `payments.service.ts` memanggil `payment-provider.ts`, bukan langsung SDK Midtrans.
- `courses.service.ts` memanggil `courses.repository.ts`, bukan Prisma langsung di semua tempat.
- `courses.policy.ts` menangani aturan akses creator/learner/admin.
- `storage.service.ts` menangani upload dan signed access untuk file private.

## Todo List Implementasi

### Progress Terakhir - 2026-05-28

Fokus sesi terakhir: memverifikasi Produk Dasar yang belum di-commit dan mulai Course Builder untuk module serta lesson.

- Events sudah tidak lagi memakai tampilan timeline produksi lama.
- Halaman `/events` sekarang fokus pada scheduler calendar.
- Calendar memakai FullCalendar dengan mode `Month`, `Week`, `3 Days`, `Day`, `Year`, dan `Schedule`.
- Event sudah mendukung rentang waktu melalui `ContentItem.startAt`, `ContentItem.endAt`, `ContentItem.allDay`, dan `ContentItem.timezone`.
- Klik tanggal/jam atau drag rentang kalender membuka modal tambah event.
- Klik event membuka modal edit/delete.
- Event bisa dipindah dan di-resize dari kalender, lalu tersimpan via tRPC.
- Filter format konten dan status tersedia di header calendar.
- Komponen Events lama yang sudah tidak dipakai sudah dibersihkan.
- Migration terbaru: `prisma/migrations/20260519155816_add_content_item_event_range/`.
- Modul Produk Dasar sudah mulai diimplementasikan melalui tRPC router `products`.
- CRUD produk dasar sudah tersedia untuk `EBOOK` dan `COURSE`: list, filter, create, update metadata/status, detail, dan delete dengan guard order.
- Produk memakai validation schema Zod dan ownership check berbasis `ctx.user.id`.
- Halaman `/produk/e-book` dan `/produk/course` sudah memakai `ProductManager`.
- Halaman detail internal `/produk/e-book/[product-id]` dan `/produk/course/[product-id]` sudah tersedia.
- Preview e-book sudah tersedia melalui `fileUrl` dengan iframe viewer.
- Upload file e-book PDF sudah memakai private storage lokal di `storage/private`.
- Endpoint `/api/products/[product-id]/ebook-file` sudah mendukung upload, preview inline, dan download.
- Akses file e-book sudah dibatasi untuk owner produk atau buyer yang memiliki order `PAID`.
- Catatan: payment/checkout belum membuat order `PAID` otomatis karena flow payment masih fase berikutnya.
- Router tRPC `courses` sudah ditambahkan untuk Course Builder.
- Course Builder sudah bisa tambah/update/hapus module course.
- Course Builder sudah bisa tambah/update/hapus lesson course.
- Lesson sudah memiliki editor materi bacaan sederhana berbasis textarea.
- Lesson video sudah memiliki input video URL/embed URL dengan preview iframe untuk URL yang bisa di-embed.
- Semua mutation Course Builder memakai validation schema Zod dan ownership check dari course owner.
- Halaman detail internal `/produk/course/[product-id]` sekarang memuat Course Builder.

- Preview course sebagai creator sudah tersedia dari detail internal course.
- Learner area dasar sudah menampilkan enrollment course, course player, sidebar module/lesson, viewer bacaan/video, resource lesson, dan simpan progress lesson.
- Quiz attempt learner sudah bisa submit jawaban, menghitung skor, menyimpan attempt, dan menandai lulus/belum lulus berdasarkan passing score.
- Backend payment awal sudah ditambahkan melalui router tRPC `payments`.
- `payments.checkout` membuat order `PENDING`, membuat transaksi Midtrans Snap saat env tersedia, dan mencegah pembelian produk sendiri atau produk yang sudah dimiliki.
- Webhook `/api/payment/webhook` memverifikasi signature Midtrans, memperbarui status order/transaksi, dan membuat enrollment course otomatis saat order `PAID`.
- Halaman sales course publik `/{username}/course/[course-slug]` sudah memakai data produk aktif dan memiliki CTA checkout.
- Halaman sales e-book publik `/{username}/product/[product-slug]` sudah tersedia untuk CTA checkout produk digital.
- Halaman status order `/payment/orders/[order-id]` sudah tersedia untuk melihat status webhook, membuka course, atau mengunduh e-book setelah `PAID`.
- Course completion sudah dihitung otomatis dari progress lesson dan disimpan ke `Enrollment.completedAt`.
- Tracking analytics backend sudah mencatat `CHECKOUT_STARTED`, `PURCHASE_COMPLETED`, `COURSE_STARTED`, `LESSON_COMPLETED`, dan `QUIZ_SUBMITTED`.
- Endpoint public analytics `/api/analytics/track` sudah tersedia untuk page view, product click, dan link/block click.
- Route publik `/{username}` sudah merender public page yang published atau fallback produk aktif, dengan tracking view/click dasar.
- Dashboard `/statistics` sudah menampilkan summary page view/click, revenue, conversion, product performance, enrollment, progress course, dan quiz score.
- Appearance editor `/appearance` sudah tersedia untuk mengatur profile section, theme sederhana, publish/unpublish, dan block link/produk/konten.
- Appearance editor sudah memiliki mobile preview, kontrol urutan block naik/turun, edit block inline, dan template theme cepat.
- Route publik `/{username}/content/[content-slug]` sudah tersedia untuk block konten/blog yang statusnya `PUBLISHED`.
- Admin overview `/admin` sudah menampilkan summary user, produk, order, revenue, failed payment, dan enrollment.
- Admin order monitoring `/admin/orders` sudah menampilkan order lintas platform dengan buyer, creator, produk, status payment, dan enrollment.
- Admin payment monitoring `/admin/payments` sudah menampilkan transaksi payment gateway dengan provider, reference, order, buyer, creator, dan status.
- Admin users `/admin/users` sudah menampilkan user list, role, public page status, dan ringkasan aktivitas dasar.
- Admin content `/admin/content` sudah menampilkan moderation list konten lintas user, status, jadwal, owner, dan jumlah public block terkait.
- Admin products `/admin/products` sudah menampilkan moderation list produk/course lintas user, owner, status, order, enrollment, dan module/block count.
- Admin bisa mengubah status user `ACTIVE/INACTIVE`; user inactive ditolak saat login dan saat session guard berikutnya.
- Admin bisa mengubah moderation status produk/course `APPROVED/REVIEW_REQUIRED/DISABLED`; produk disabled tidak bisa dibuka publik atau checkout.
- Aksi admin untuk status user dan product moderation sudah tercatat ke `AdminAuditLog` dan ditampilkan di admin overview.
- Admin users/content/products/orders/payments sudah memiliki search dan filter via query string untuk investigasi list besar.
- Admin settings `/admin/settings` sudah menjadi form konfigurasi global untuk payment provider/mode, platform fee, upload policy, dan feature flags.
- Platform settings tersimpan di model `PlatformSettings`, mutation admin tercatat ke audit log, dan checkout publik mengikuti mode settings sebelum memanggil provider payment.
- Admin statistics `/admin/statistics` sudah menampilkan metric platform, trend 30 hari, distribusi status, top products, dan top creators memakai ApexCharts.

Lanjut berikutnya yang disarankan: rapikan flow public checkout agar membaca status settings pada UI CTA, atau lanjut ke hardening upload policy.

### 0. Architecture Guardrails

- [x] Setup tRPC gateway di `app/api/trpc/[trpc]/route.ts`.
- [x] Buat `server/trpc/context.ts`.
- [x] Buat `server/trpc/root.ts`.
- [x] Buat `server/trpc/router.ts`.
- [x] Buat `server/trpc/procedures.ts`.
- [x] Tentukan pola protected procedure, admin procedure, dan public procedure.
- [x] Buat folder `server/modules`.
- [x] Terapkan pola router/service/repository/schema/policy per domain.
- [x] Tambahkan aturan file backend maksimal 500 baris ke review checklist.
- [x] Tambahkan aturan file frontend maksimal 1000 baris ke review checklist.
- [x] Terapkan kebab-case untuk semua file baru.
- [x] Terapkan penamaan `domain.router.ts`, `domain.service.ts`, `domain.repository.ts`, `domain.schema.ts`, dan `domain.policy.ts`.
- [x] Buat shared component variant system untuk komponen reusable.
- [x] Pastikan page hanya menyusun komponen, bukan menampung UI besar.
- [x] Tambahkan validation schema untuk setiap tRPC mutation yang sudah dibuat.
- [ ] Tambahkan ownership check untuk setiap resource user.
- [x] Tambahkan admin role guard.
- [x] Tambahkan enrollment guard untuk learner.
- [ ] Siapkan abstraction untuk payment provider.
- [x] Siapkan abstraction untuk private file storage.

### 1. Struktur Route, Layout, dan Menu

- [x] Buat route group `app/(dashboard)`.
- [x] Buat route group `app/(auth)`.
- [x] Buat route group `app/(learner)`.
- [x] Buat route `app/admin`.
- [x] Buat dashboard layout dengan sidebar dan header.
- [x] Buat learner layout sederhana.
- [x] Buat admin layout dengan sidebar admin.
- [x] Ubah menu `Timeline` menjadi `Events`.
- [x] Buat placeholder page untuk `Events`.
- [x] Buat placeholder page untuk `Bank Konten > Video Short`.
- [x] Buat placeholder page untuk `Bank Konten > Carousel Post`.
- [x] Buat placeholder page untuk `Bank Konten > Blog`.
- [x] Buat placeholder page untuk `Bank Konten > Long Video`.
- [x] Buat placeholder page untuk `Produk > E-book`.
- [x] Buat placeholder page untuk `Produk > Course`.
- [x] Buat placeholder page untuk `Appearance`.
- [x] Buat placeholder page untuk `Statistics`.
- [x] Buat placeholder page untuk `Payment`.
- [x] Buat placeholder page untuk `Account`.
- [x] Buat placeholder page untuk `/learn`.
- [x] Buat placeholder page untuk `/admin/users`.
- [x] Buat placeholder page untuk `/admin/content`.
- [x] Buat placeholder page untuk `/admin/products`.
- [x] Buat placeholder page untuk `/admin/orders`.
- [x] Buat placeholder page untuk `/admin/payments`.
- [x] Buat placeholder page untuk `/admin/settings`.
- [x] Buat placeholder page untuk `/admin/statistics`.

### 2. Auth, Role, dan Access Guard

- [x] Tambahkan model auth di Prisma.
- [x] Tambahkan field `role: ADMIN | USER` pada user.
- [x] Setup Auth.js/NextAuth.
- [x] Buat halaman login.
- [x] Buat halaman register.
- [x] Buat logout flow.
- [x] Proteksi route dashboard untuk user login.
- [x] Proteksi route learner untuk user login.
- [x] Proteksi route `/admin/*` hanya untuk `ADMIN`.
- [x] Redirect guest ke `/login` ketika membuka dashboard.
- [x] Redirect role `USER` keluar dari `/admin/*`.
- [x] Tambahkan seed user admin awal.

### 3. Schema Ownership Data

- [x] Tambahkan `ContentItem`.
- [x] Tambahkan `Product`.
- [x] Tambahkan `PublicPage`.
- [x] Tambahkan relasi `userId` untuk data milik user.
- [x] Pastikan query dashboard selalu filter berdasarkan `userId`.
- [ ] Siapkan migrasi data lama dari `Topic` dan `TimelineWeek`.

### 4. Events dan Bank Konten Dasar

- [x] Buat CRUD `ContentItem`.
- [x] Tambahkan tipe konten `VIDEO_SHORT`.
- [x] Tambahkan tipe konten `CAROUSEL_POST`.
- [x] Tambahkan tipe konten `BLOG`.
- [x] Tambahkan tipe konten `LONG_VIDEO`.
- [x] Tambahkan status `DRAFT`, `SCHEDULED`, `PUBLISHED`, `ARCHIVED`.
- [x] Tambahkan field tanggal publish/schedule.
- [x] Tambahkan field event range `startAt`, `endAt`, `allDay`, dan `timezone`.
- [x] Buat list konten per format.
- [x] Buat search dan filter status.
- [x] Buat tampilan Events list.
- [x] Buat tampilan Events calendar month.
- [x] Tambahkan modal tambah event dari klik tanggal.
- [x] Tambahkan modal detail/edit event.
- [x] Tambahkan dukungan event multi-hari.
- [x] Tambahkan rentang jam untuk event time-grid.
- [x] Tambahkan view week, year, dan list setelah month view stabil.
- [x] Tambahkan view 3 days dan day.
- [x] Tambahkan filter format dan status di calendar.
- [x] Tambahkan drag-and-drop dan resize event.
- [x] Bersihkan timeline produksi lama dari halaman Events.

### 5. Produk Dasar

- [x] Buat CRUD product.
- [x] Tambahkan tipe produk `EBOOK`.
- [x] Tambahkan tipe produk `COURSE`.
- [x] Tambahkan harga dan currency.
- [x] Tambahkan status produk `DRAFT`, `ACTIVE`, `INACTIVE`.
- [x] Tambahkan cover image.
- [x] Tambahkan upload file e-book nyata/private storage.
- [x] Tambahkan preview/viewer file e-book.
- [x] Siapkan akses download e-book untuk order paid.
- [x] Buat halaman detail produk internal.

### 6. Course Builder dan Quiz Authoring

- [x] Tambahkan `CourseModule`.
- [x] Tambahkan `CourseLesson`.
- [x] Tambahkan lesson type `READING`.
- [x] Tambahkan lesson type `VIDEO`.
- [x] Buat editor materi bacaan.
- [x] Buat input video URL/embed.
- [x] Tambahkan upload file pendukung lesson.
- [x] Tambahkan `LessonResource`.
- [x] Tambahkan resource type `TOOL`.
- [x] Tambahkan resource type `OFFICIAL_DOC`.
- [x] Tambahkan resource type `SOURCE`.
- [x] Tambahkan resource type `REPOSITORY`.
- [x] Tambahkan resource type `FILE`.
- [x] Tambahkan `Quiz`.
- [x] Tambahkan `QuizQuestion`.
- [x] Tambahkan `QuizAnswerOption`.
- [x] Buat quiz pilihan ganda.
- [x] Tambahkan passing score.
- [x] Tambahkan max attempts.
- [x] Buat preview course sebagai creator.

### 7. Appearance dan Public Page

- [x] Buat model dan editor `PublicPage`.
- [x] Buat public route `/{username}`.
- [x] Buat block link biasa.
- [x] Buat block produk e-book.
- [x] Buat block course.
- [x] Buat block konten/blog highlight.
- [x] Tambahkan pengaturan profile section.
- [x] Tambahkan theme sederhana.
- [x] Tambahkan mobile preview.
- [x] Tambahkan publish/unpublish public page.
- [x] Buat public course sales page `/{username}/course/[course-slug]`.

### 8. Payment dan Enrollment

- [x] Buat abstraction `paymentProvider`.
- [x] Siapkan konfigurasi Midtrans sandbox.
- [x] Buat checkout endpoint.
- [x] Buat webhook endpoint.
- [x] Sambungkan CTA checkout dari halaman publik produk/course.
- [x] Tambahkan halaman status order setelah checkout.
- [x] Buat model `Order`.
- [x] Buat model `PaymentTransaction`.
- [x] Update order status dari webhook.
- [x] Buka akses download e-book setelah order paid.
- [x] Buat model `Enrollment`.
- [x] Buat enrollment otomatis untuk course setelah order paid.
- [x] Pastikan user tidak bisa membeli produk miliknya sendiri jika aturan ini dipilih.

### 9. Learner Area

- [x] Buat halaman `/learn`.
- [x] Buat halaman `/learn/[course-slug]`.
- [x] Tampilkan daftar course yang dibeli.
- [x] Tampilkan sidebar module dan lesson.
- [x] Buat viewer lesson bacaan.
- [x] Buat viewer lesson video.
- [x] Tampilkan resource/tools/dokumentasi resmi per lesson.
- [x] Tambahkan `LessonProgress`.
- [x] Simpan progress lesson.
- [x] Tambahkan `QuizAttempt`.
- [x] Buat flow mengerjakan quiz.
- [x] Hitung skor quiz.
- [x] Tandai quiz lulus/belum lulus.
- [x] Hitung completion course.

### 10. Statistics

- [x] Tambahkan `AnalyticsEvent`.
- [x] Track page view halaman publik.
- [x] Track klik block/link.
- [x] Track klik produk.
- [x] Track checkout started.
- [x] Track purchase completed.
- [x] Track course started.
- [x] Track lesson completed.
- [x] Track quiz submitted.
- [x] Buat dashboard statistik user.
- [x] Tampilkan revenue.
- [x] Tampilkan conversion rate.
- [x] Tampilkan product performance.
- [x] Tampilkan course progress.
- [x] Tampilkan quiz score summary.

### 11. Admin Area

- [x] Buat dashboard admin.
- [x] Buat user management.
- [x] Buat content moderation list.
- [x] Buat product/course moderation list.
- [x] Buat order monitoring.
- [x] Buat payment monitoring.
- [x] Tambahkan search/filter untuk tabel admin users, content, products, orders, dan payments.
- [x] Buat platform settings placeholder.
- [x] Buat platform settings dasar yang tersimpan di database.
- [x] Buat platform statistics.
- [x] Tambahkan status aktif/nonaktif untuk user.
- [x] Tambahkan status moderation untuk produk/course.
- [x] Tambahkan audit log untuk aksi admin pada fase lanjutan.
