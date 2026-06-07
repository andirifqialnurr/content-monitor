# Skenario QA Content Monitor

Dokumen ini menjadi panduan pengujian manual untuk semua menu dan fitur MVP. Data awal dibuat oleh `npm run db:seed`.

## 1. Setup Pengujian

Jalankan dari root repo:

```bash
npm install
npm run db:deploy
npm run db:seed
npm run dev
```

URL lokal:

```text
http://127.0.0.1:4000
```

Quality gate sebelum pengujian manual:

```bash
npm run guardrails
npm run lint
npm run typecheck
npm run build
npm run smoke:auth
```

Catatan payment:

- Seed membuat `PlatformSettings` ke `MIDTRANS` + `SANDBOX` + `publicCheckoutEnabled=true`.
- Checkout live ke Midtrans hanya bisa sukses jika `MIDTRANS_SERVER_KEY` benar.
- Seed sudah membuat order `PAID`, `PENDING`, `FAILED`, dan `EXPIRED` supaya Payment, Learner, Statistics, dan Admin tetap bisa diuji tanpa webhook real.

## 2. Akun Seed

| Role | Email | Password | Username | Tujuan |
|---|---|---|---|---|
| Admin | dari `ADMIN_EMAIL`, default `admin@content-monitor.local` | dari `ADMIN_PASSWORD`, default `AdminPassword123!` | default `admin` | Mengatur aplikasi dan moderasi platform |
| Creator + Buyer | `creator@content-monitor.local` | `CreatorPassword123!` | `creator-demo` | Membuat konten/produk dan juga membeli course partner |
| Buyer/Learner | `buyer@content-monitor.local` | `BuyerPassword123!` | `buyer-demo` | Membeli produk creator, mengakses learner area, submit quiz |
| Partner Creator | `partner@content-monitor.local` | `PartnerPassword123!` | `partner-demo` | Menyediakan produk yang dibeli oleh creator |
| Inactive User | `inactive@content-monitor.local` | `InactivePassword123!` | `inactive-demo` | Memastikan user inactive tidak bisa login |

## 3. Data Seed Utama

Creator `creator-demo` memiliki:

- Konten semua format:
  - Draft video short.
  - Scheduled video short dengan jam.
  - Scheduled carousel multi-hari.
  - Published blog dengan public route.
  - Published long video.
  - Archived blog.
- Produk:
  - Active e-book `Creator Launch Playbook`.
  - Active course `Content System Course`.
  - Draft e-book.
  - Inactive course.
  - Active e-book dengan moderation `DISABLED`.
- Course builder:
  - 2 module.
  - 4 lesson.
  - Lesson `READING` dan `VIDEO`.
  - Resource type `TOOL`, `OFFICIAL_DOC`, `SOURCE`, `REPOSITORY`, dan `FILE`.
  - Quiz di lesson, module, dan course.
  - Multiple choice dan short answer.
- Appearance:
  - Public page published `/{username}`.
  - Blocks: CTA, product e-book, product course, content/blog highlight, hidden block.
- Payment:
  - Order paid dari buyer untuk e-book.
  - Order paid dari buyer untuk course.
  - Order pending.
  - Order failed untuk produk disabled.
  - Creator juga punya purchase paid ke partner course.
- Learner/statistics:
  - Enrollment buyer ke creator course.
  - Progress lesson completed dan in progress.
  - Quiz attempt passed.
  - Analytics events untuk page view, click, checkout, purchase, course started, lesson completed, dan quiz submitted.

Partner `partner-demo` memiliki:

- Active course `Partner Analytics Bootcamp`.
- Active e-book `Partner Funnel Templates` dengan moderation `REVIEW_REQUIRED`.
- Public page published.
- Paid order dari creator ke partner course.
- Expired order dari creator ke partner e-book.

## 4. Coverage Matrix Menu

| Menu/Route | Akun Utama | Data Seed | Fitur yang Wajib Diuji |
|---|---|---|---|
| `/login` | semua | semua akun | Login valid, login invalid, inactive user ditolak |
| `/register` | guest | akun baru | Register, auto-login, validasi username/email unik |
| `/forgot-password` | guest | buyer/creator | Request reset, response generik, dev reset link |
| `/reset-password` | guest | token reset | Token invalid, password baru, login ulang |
| `/events` | creator | content scheduled | Month/week/3 days/day/year/schedule, filter, create/edit/delete, drag/resize |
| `/bank-konten/video-short` | creator | video content | List, create, edit, search, filter status |
| `/bank-konten/carousel-post` | creator | carousel content | List, create, edit, status, schedule |
| `/bank-konten/blog` | creator | blog content | Slug, body, published route, archived item |
| `/bank-konten/long-video` | creator | long video content | Title, body/script, scheduled/published status |
| `/produk/e-book` | creator | e-book active/draft/disabled | CRUD, detail, status, upload/preview/download |
| `/produk/course` | creator | course active/inactive | CRUD, detail, course builder, preview |
| `/produk/course/[id]` | creator | modules/lessons/resources/quizzes | Add/edit/delete module, lesson, resource, quiz |
| `/appearance` | creator | public page blocks | Profile, theme, block CRUD, reorder, hide/show, publish |
| `/statistics` | creator | analytics/events/orders | Revenue, conversion, page view, clicks, course progress, quiz score |
| `/payment` | creator/buyer | orders all statuses | Sales tab, purchase tab, detail, paid actions, status labels |
| `/payment/orders/[id]` | buyer/creator | paid/pending/failed orders | Status order, download e-book, open course |
| `/account` | semua active user | profiles | Update profile, username, avatar, timezone, change password, logout |
| `/learn` | buyer/creator | enrollments | List course bought, empty state if no enrollment |
| `/learn/[course-slug]` | buyer/creator | course enrollment | Lesson viewer, resources, progress, quiz attempt |
| `/{username}` | guest | creator/partner page | Public page render, hidden block ignored, click tracking |
| `/{username}/product/[slug]` | guest/login | e-book product | Product page, CTA status, checkout |
| `/{username}/course/[slug]` | guest/login | course product | Curriculum preview, checkout |
| `/{username}/content/[slug]` | guest | published blog | Published content render, unpublished blocked |
| `/admin` | admin | platform summary | Overview metrics and audit log |
| `/admin/users` | admin | active/inactive users | Search/filter, status toggle, audit log |
| `/admin/content` | admin | all content | Search/filter moderation list |
| `/admin/products` | admin | approved/review/disabled | Product moderation status updates |
| `/admin/orders` | admin | all orders | Search/filter status, buyer/creator/product |
| `/admin/payments` | admin | transactions | Provider/status/reference monitoring |
| `/admin/settings` | admin | platform settings | Payment mode, checkout flag, upload policy, feature flags |
| `/admin/statistics` | admin | platform analytics | Platform metrics, trend chart, top products/creators |

## 5. Skenario Auth dan Account

### 5.1 Login aktif

1. Buka `/login`.
2. Login sebagai `creator@content-monitor.local`.
3. Pastikan redirect ke `/events`.
4. Buka `/account`.
5. Pastikan profile `Rina Creator`, username `creator-demo`, role `USER`, status `ACTIVE`.

Expected:

- Login berhasil.
- Sidebar dashboard tampil.
- `/account` bisa dibuka.

### 5.2 Login inactive user

1. Logout.
2. Login dengan `inactive@content-monitor.local` dan `InactivePassword123!`.

Expected:

- Login ditolak dengan pesan email/password tidak valid.
- User tetap berada di halaman login.

### 5.3 Register user baru

1. Buka `/register`.
2. Buat user baru dengan username unik.
3. Pastikan auto-login dan redirect ke `/events`.
4. Buka `/account`.

Expected:

- User baru role `USER`.
- Dashboard protected bisa diakses.
- Public username unik.

### 5.4 Forgot/reset password

1. Buka `/forgot-password`.
2. Input `buyer@content-monitor.local`.
3. Di development, klik reset link yang muncul.
4. Isi password baru.
5. Login ulang dengan password baru.
6. Login ke `/account` dan ganti kembali password ke `BuyerPassword123!`.

Expected:

- Response forgot password tetap generik.
- Token valid hanya sekali.
- Password baru bisa dipakai login.
- Token lama gagal jika dipakai ulang.

### 5.5 Update account

1. Login sebagai creator.
2. Buka `/account`.
3. Ubah bio, avatar URL, timezone.
4. Simpan.
5. Buka `/{username}`.

Expected:

- Profile tersimpan.
- Public page mengikuti display name/bio terbaru.
- Username yang sudah dipakai user lain ditolak.

## 6. Skenario Creator: Events

### 6.1 Membaca kalender seed

1. Login sebagai creator.
2. Buka `/events`.
3. Cek view Month.
4. Ganti ke Week, 3 Days, Day, Year, dan Schedule.
5. Filter format `VIDEO_SHORT`, `CAROUSEL_POST`, `BLOG`, `LONG_VIDEO`.
6. Filter status `DRAFT`, `SCHEDULED`, `PUBLISHED`, `ARCHIVED`.

Expected:

- Scheduled video tampil di slot jam.
- Carousel multi-hari tampil sebagai bar/range.
- Published/archived bisa difilter.
- Year dan Schedule tetap menampilkan data yang konsisten.

### 6.2 Buat event dari kalender

1. Klik tanggal/jam kosong.
2. Buat event `VIDEO_SHORT` dengan status `SCHEDULED`.
3. Simpan.
4. Klik event yang baru dibuat.
5. Edit judul, status, jam, dan timezone.
6. Simpan.

Expected:

- Event baru muncul di kalender.
- Edit tersimpan.
- Data muncul juga di Bank Konten sesuai format.

### 6.3 Drag/resize event

1. Drag event scheduled ke tanggal/jam lain.
2. Resize durasi event.
3. Refresh halaman.

Expected:

- `startAt`, `endAt`, `allDay`, dan timezone tersimpan.
- Posisi kalender tidak kembali ke nilai lama.

## 7. Skenario Creator: Bank Konten

Ulangi pola berikut untuk semua sub-menu:

- `/bank-konten/video-short`
- `/bank-konten/carousel-post`
- `/bank-konten/blog`
- `/bank-konten/long-video`

Langkah:

1. Buka sub-menu.
2. Pastikan item seed muncul sesuai tipe.
3. Search dengan potongan judul.
4. Filter status.
5. Buat konten baru.
6. Edit judul/body/status/schedule.
7. Untuk Blog, isi slug dan ubah status ke `PUBLISHED`.
8. Buka public content route `/{username}/content/{content-slug}`.

Expected:

- Tiap format hanya menampilkan content type yang sesuai.
- Search dan filter status akurat.
- Published blog bisa dibuka publik.
- Draft/scheduled/archived tidak bisa dirender sebagai konten publik.
- User lain tidak bisa melihat atau mengubah data creator dari dashboard-nya.

## 8. Skenario Creator: Produk E-book

### 8.1 List dan detail

1. Login sebagai creator.
2. Buka `/produk/e-book`.
3. Pastikan produk muncul:
   - `Creator Launch Playbook` active.
   - `Draft Monetization Notes` draft.
   - `Disabled Growth Swipefile` active tetapi moderation disabled.
4. Buka detail `Creator Launch Playbook`.

Expected:

- Count order tampil.
- Metadata produk bisa diedit.
- Product page public tersedia untuk produk active approved.

### 8.2 Upload PDF

1. Di detail e-book, upload file `.pdf` valid.
2. Coba upload file non-PDF.
3. Coba upload file kosong atau MIME tidak sesuai.

Expected:

- PDF valid tersimpan ke private storage.
- Preview iframe muncul.
- Non-PDF ditolak.
- Upload mengikuti policy `/admin/settings`.

### 8.3 Download setelah paid

1. Login sebagai buyer.
2. Buka `/payment`.
3. Tab Pembelian.
4. Pada paid e-book, klik Download.

Expected:

- Buyer dengan order `PAID` bisa membuka file/redirect e-book.
- User tanpa order paid mendapat forbidden/not found.

## 9. Skenario Creator: Course Builder

### 9.1 CRUD course

1. Login sebagai creator.
2. Buka `/produk/course`.
3. Pastikan `Content System Course` active dan `Inactive Repurpose Lab` inactive.
4. Buat course baru.
5. Edit metadata course.
6. Ubah status draft/active/inactive.

Expected:

- Course muncul di list sesuai filter.
- Active approved course bisa muncul di public page.

### 9.2 Builder module dan lesson

1. Buka detail `Content System Course`.
2. Tambahkan module baru.
3. Tambahkan lesson `READING`.
4. Tambahkan lesson `VIDEO`.
5. Edit body reading.
6. Isi video URL/embed URL.
7. Hapus lesson uji.
8. Hapus module uji.

Expected:

- Urutan module/lesson konsisten.
- Reading viewer menampilkan body.
- Video viewer menampilkan embed jika URL valid.

### 9.3 Resources

1. Pada lesson, tambahkan resource type:
   - `TOOL`
   - `OFFICIAL_DOC`
   - `SOURCE`
   - `REPOSITORY`
   - `FILE`
2. Isi name, URL, description.
3. Preview course.

Expected:

- Semua resource tampil di preview creator dan learner.
- URL eksternal terbuka di tab baru.

### 9.4 Quiz authoring

1. Tambahkan quiz pada lesson/module/course.
2. Buat pertanyaan multiple choice.
3. Buat pertanyaan short answer.
4. Set passing score dan max attempts.
5. Preview course.

Expected:

- Quiz tampil di lokasi yang benar.
- Pilihan benar tersimpan.
- Max attempts dan passing score digunakan saat learner submit.

## 10. Skenario Appearance dan Public Page

### 10.1 Edit profile dan theme

1. Login sebagai creator.
2. Buka `/appearance`.
3. Ubah display name, bio, background color, text color, button style, font preset.
4. Simpan.
5. Buka `/{username}` di tab baru.

Expected:

- Mobile preview berubah.
- Public page mengikuti theme dan profile.

### 10.2 Block management

1. Tambah block `LINK`.
2. Tambah block `CTA`.
3. Tambah block produk e-book.
4. Tambah block course.
5. Tambah block content/blog highlight.
6. Reorder block naik/turun.
7. Hide salah satu block.
8. Publish/unpublish page.

Expected:

- Public page hanya menampilkan block visible.
- Produk draft/inactive/disabled tidak muncul di renderer publik.
- Content yang belum `PUBLISHED` tidak muncul.
- Click block tercatat analytics jika tracking aktif.

## 11. Skenario Public Visitor dan Checkout

### 11.1 Public page

1. Buka `http://127.0.0.1:4000/creator-demo` sebagai guest.
2. Klik CTA booking.
3. Klik e-book.
4. Klik course.
5. Klik content/blog.

Expected:

- Public page render tanpa login.
- Hidden block tidak tampil.
- Produk active approved dapat dibuka.
- Click tracking masuk ke statistics.

### 11.2 Product page e-book

1. Buka `/creator-demo/product/creator-launch-playbook`.
2. Pastikan judul, deskripsi, harga, dan CTA tampil.
3. Login sebagai buyer.
4. Klik checkout jika Midtrans sandbox key valid.

Expected:

- Guest diarahkan login jika checkout butuh auth.
- Buyer tidak bisa membeli produk sendiri.
- Checkout disabled jika admin mematikan public checkout atau payment mode disabled.
- Jika Midtrans valid, order `PENDING` dibuat dan user diarahkan ke payment page.

### 11.3 Course sales page

1. Buka `/creator-demo/course/content-system-course`.
2. Pastikan curriculum preview tampil.
3. Pastikan inactive/disabled course tidak bisa dibuka publik.

Expected:

- Course active approved render.
- Lesson preview bisa dibaca sesuai `isPreview`.
- CTA checkout mengikuti platform setting.

## 12. Skenario Buyer/Learner

### 12.1 Learner dashboard

1. Login sebagai buyer.
2. Buka `/learn`.
3. Pastikan `Content System Course` muncul.
4. Buka course.

Expected:

- Hanya course dengan enrollment active yang tampil.
- Course milik partner tidak tampil untuk buyer jika tidak ada enrollment.

### 12.2 Course player

1. Buka lesson reading.
2. Buka lesson video.
3. Lihat resources.
4. Tandai lesson completed.
5. Refresh.

Expected:

- Progress tersimpan.
- `COURSE_STARTED` tercatat saat progress pertama.
- `LESSON_COMPLETED` tercatat saat lesson completed.
- Completion course dihitung jika semua lesson complete.

### 12.3 Quiz attempt

1. Buka quiz `Quiz hook dan CTA`.
2. Submit jawaban benar.
3. Submit jawaban salah.
4. Uji max attempts.

Expected:

- Skor dihitung sesuai points.
- Status passed mengikuti passing score.
- Answers tersimpan.
- Max attempts membatasi submit.
- `QUIZ_SUBMITTED` tercatat.

## 13. Skenario Payment Dashboard

### 13.1 Creator sebagai seller

1. Login sebagai creator.
2. Buka `/payment`.
3. Tab Penjualan.
4. Pastikan order status:
   - Paid course.
   - Paid e-book.
   - Pending course.
   - Failed disabled product.
5. Buka detail order.

Expected:

- Summary revenue paid sesuai order paid.
- Status badge benar.
- Detail order bisa dibuka oleh creator.

### 13.2 Creator sebagai buyer

1. Masih login sebagai creator.
2. Buka tab Pembelian.
3. Pastikan paid order ke `Partner Analytics Bootcamp` muncul.
4. Klik Buka course.
5. Pastikan expired order e-book partner muncul.

Expected:

- Satu user bisa menjadi creator dan buyer.
- Paid course memberi akses learner.
- Expired order tidak memberi download.

### 13.3 Buyer purchase actions

1. Login sebagai buyer.
2. Buka `/payment`.
3. Tab Pembelian.
4. Klik Detail pada paid e-book.
5. Klik Download.
6. Klik Buka course pada paid course.

Expected:

- Paid e-book bisa download/redirect.
- Paid course masuk learner area.
- Pending/failed order tidak membuka akses learner/download.

## 14. Skenario Statistics User

1. Login sebagai creator.
2. Buka `/statistics`.
3. Validasi summary:
   - Page views.
   - Link/product clicks.
   - Checkout started.
   - Purchase completed.
   - Revenue.
   - Conversion rate.
4. Cek product performance.
5. Cek course enrollment/progress.
6. Cek quiz score summary.

Expected:

- Data hanya milik creator.
- Paid order seed masuk revenue.
- Course progress buyer masuk statistik.
- Quiz attempt seed masuk score summary.

## 15. Skenario Admin Area

### 15.1 Guard admin

1. Login sebagai creator.
2. Buka `/admin/users`.
3. Login sebagai admin.
4. Buka `/admin/users`.

Expected:

- Creator ditolak/redirect dari admin.
- Admin bisa membuka admin area.

### 15.2 Admin overview

1. Login sebagai admin.
2. Buka `/admin`.
3. Cek cards summary, failed payment, enrollment, audit log.

Expected:

- Data seed QA muncul.
- Audit log platform/user/product tampil.

### 15.3 User management

1. Buka `/admin/users`.
2. Search `creator`.
3. Filter status `INACTIVE`.
4. Ubah status inactive user menjadi active.
5. Ubah kembali menjadi inactive.

Expected:

- Search/filter bekerja.
- Status berubah.
- Audit log `USER_STATUS_UPDATED` tercatat.
- User inactive tidak bisa login.

### 15.4 Content moderation list

1. Buka `/admin/content`.
2. Search `launch`.
3. Filter format/status.
4. Cek owner, jadwal, status, dan jumlah block publik.

Expected:

- Admin melihat konten lintas user.
- Data tidak berubah kecuali aksi moderation yang tersedia.

### 15.5 Product moderation

1. Buka `/admin/products`.
2. Search `Disabled`.
3. Filter moderation `DISABLED`.
4. Ubah moderation status produk ke `REVIEW_REQUIRED`.
5. Ubah kembali ke `DISABLED`.

Expected:

- Produk disabled tidak bisa dibuka publik/checkout.
- Audit log `PRODUCT_MODERATION_UPDATED` tercatat.

### 15.6 Orders dan payments monitoring

1. Buka `/admin/orders`.
2. Filter status `PAID`, `PENDING`, `FAILED`, `EXPIRED`.
3. Search buyer/creator/product.
4. Buka `/admin/payments`.
5. Filter provider `MIDTRANS` dan status transaksi.

Expected:

- Admin melihat order/transaksi lintas platform.
- Reference provider dan status tampil.
- Data buyer/creator/product mudah diinvestigasi.

### 15.7 Platform settings

1. Buka `/admin/settings`.
2. Ubah `publicCheckoutEnabled` off.
3. Buka public product page.
4. Pastikan CTA checkout disabled.
5. Balikkan setting on.
6. Ubah max upload MB dan allowed MIME types.

Expected:

- Settings tersimpan di `PlatformSettings`.
- Mutation tercatat audit log.
- Public checkout mengikuti setting server.
- Upload policy mempengaruhi upload e-book.

### 15.8 Platform statistics

1. Buka `/admin/statistics`.
2. Cek trend 30 hari.
3. Cek distribusi user/product/order.
4. Cek top products dan top creators.

Expected:

- Admin melihat statistik lintas platform.
- Chart render tanpa overlap.
- Data seed muncul sebagai baseline.

## 16. Skenario Security dan Ownership

### 16.1 Ownership dashboard

1. Login sebagai buyer.
2. Buka `/produk/e-book`.
3. Pastikan produk creator tidak muncul.
4. Buka URL detail produk creator secara langsung jika ID diketahui.

Expected:

- Data user lain tidak muncul.
- Akses langsung ditolak/not found.

### 16.2 Checkout own product

1. Login sebagai creator.
2. Buka `/creator-demo/product/creator-launch-playbook`.
3. Coba checkout.

Expected:

- User tidak bisa membeli produk sendiri.

### 16.3 Learner enrollment guard

1. Login sebagai buyer.
2. Coba buka `/learn/partner-analytics-bootcamp`.
3. Login sebagai creator.
4. Buka `/learn/partner-analytics-bootcamp`.

Expected:

- Buyer tanpa enrollment partner ditolak.
- Creator dengan enrollment partner bisa membuka course.

### 16.4 E-book access guard

1. Login sebagai user baru tanpa order.
2. Coba akses `/api/products/qa-product-ebook-launch/ebook-file`.
3. Login sebagai buyer.
4. Coba akses endpoint yang sama.

Expected:

- User tanpa paid order ditolak.
- Buyer dengan paid order bisa redirect/download.

### 16.5 Public renderer guard

1. Buka public page creator.
2. Pastikan draft e-book hidden tidak tampil.
3. Pastikan disabled product tidak tampil.
4. Coba public route produk disabled.

Expected:

- Produk inactive/disabled/draft tidak render publik.
- Checkout disabled untuk resource yang tidak approved.

## 17. Regression Checklist Ringkas

Gunakan checklist ini sebelum handover:

- [ ] Auth: login, register, forgot/reset, inactive user.
- [ ] Account: update profile, username conflict, change password, logout.
- [ ] Events: semua view, filter, create/edit/delete, drag/resize.
- [ ] Bank Konten: semua format, CRUD, search, filter, public blog.
- [ ] E-book: CRUD, upload, preview, download guard.
- [ ] Course: CRUD, builder, resources, quiz, preview.
- [ ] Appearance: profile, theme, blocks, reorder, visibility, publish.
- [ ] Public pages: profile, products, course, content, tracking.
- [ ] Checkout: CTA enabled/disabled, own product blocked, Midtrans sandbox jika credential ada.
- [ ] Payment: seller/buyer tabs, statuses, order detail, paid actions.
- [ ] Learner: course list, player, progress, quiz, max attempts.
- [ ] Statistics: user metrics, revenue, conversion, progress, quiz.
- [ ] Admin users/content/products/orders/payments/settings/statistics.
- [ ] Security: ownership, admin guard, enrollment guard, file guard.
- [ ] Quality gate: guardrails, lint, typecheck, build, smoke auth.

## 18. Expected Known Limits

- Refund admin belum MVP.
- S3-compatible storage belum aktif; private e-book local storage masih dipakai untuk development/testing.
- Checkout real membutuhkan Midtrans sandbox credential valid.
- Production reset email membutuhkan service eksternal di belakang `RESET_EMAIL_WEBHOOK_URL`.
- Advisory `next-auth@4.24.14`/`uuid@8.3.2` masih dimonitor sampai ada upgrade non-breaking.

## 19. Hasil Regression Otomatis 2026-06-02

`npm run test:ui` sudah lulus untuk 4 fase:

- Progress 1: Auth, Account, Public Route.
- Progress 2: Events dan Bank Konten.
- Progress 3: Produk, Course, Appearance, Payment, Learner, Statistics.
- Progress 4: Admin Menu, Filter, Moderation, Settings.

Quality gate yang ikut diverifikasi:

- `npm run db:generate`
- `npm run db:deploy`
- `npm run guardrails`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run smoke:auth`

Catatan perbaikan dari regression:

- Schema ID domain menerima ID seed QA stabil, bukan hanya CUID.
- Public analytics tracking tidak lagi gagal untuk seed `qa-*`.
- UI regression dibuat idempotent untuk progress learner dan quiz attempt.
- Detail produk, Appearance block action, payment order row, dan admin settings save sudah distabilkan.
