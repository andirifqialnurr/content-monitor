# Content Monitor

Creator dashboard berbasis Next.js untuk merencanakan konten, mengelola produk digital, menjual e-book/course, membuat halaman publik, memantau statistik, dan mengelola order.

Stack utama:

- Next.js App Router.
- Prisma + SQLite lokal.
- tRPC untuk API internal.
- NextAuth credentials.
- Tailwind CSS, Radix primitives, shadcn/ui style components, dan lucide-react.

## Jalankan Lokal

```bash
npm install
npm run db:setup
npm run dev
```

Default URL:

```text
http://127.0.0.1:4000
```

Jika memakai Bun:

```bash
bun install
bun run db:setup
bun run dev
```

Jika muncul error chunk `.next` seperti `Cannot find module './611.js'`, hentikan dev server lalu jalankan:

```bash
npm run clean
npm run dev
```

Jangan menjalankan `npm run build` saat `npm run dev` masih aktif karena cache `.next` bisa bentrok.

## Environment

Gunakan `.env.example` sebagai template:

```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_URL="http://127.0.0.1:4000"
NEXTAUTH_SECRET="change-this-secret"
ADMIN_EMAIL="admin@content-monitor.local"
ADMIN_PASSWORD="AdminPassword123!"
ADMIN_USERNAME="admin"
ADMIN_NAME="Platform Admin"
MIDTRANS_SERVER_KEY="SB-Mid-server-your-sandbox-key"
MIDTRANS_IS_PRODUCTION="false"
PRIVATE_STORAGE_ROOT="./storage/private"
AUTH_DEV_RESET_LINKS="true"
RESET_EMAIL_FROM="Content Monitor <no-reply@content-monitor.local>"
RESET_EMAIL_WEBHOOK_URL=""
RESET_EMAIL_WEBHOOK_TOKEN=""
EMAIL_WEBHOOK_TIMEOUT_MS="8000"
```

Catatan:

- `NEXTAUTH_SECRET` wajib diganti untuk environment selain lokal.
- `MIDTRANS_SERVER_KEY` dipakai oleh payment provider Midtrans.
- Mode payment, public checkout, upload policy, dan feature flags dikelola admin dari `/admin/settings`.
- File e-book private tersimpan lokal di `PRIVATE_STORAGE_ROOT` untuk development/testing.
- Production storage diarahkan ke S3-compatible adapter pada fase berikutnya.
- Forgot password membuat token hashed. Di development, reset link ditampilkan di UI untuk smoke test.
- Production reset password bisa mengirim email melalui `RESET_EMAIL_WEBHOOK_URL`. Endpoint webhook menerima JSON `{ from, to, subject, text, html }`, optional bearer token dari `RESET_EMAIL_WEBHOOK_TOKEN`, dan timeout dari `EMAIL_WEBHOOK_TIMEOUT_MS`.

## Database

Project memakai Prisma + SQLite lokal. Script database:

```bash
npm run db:generate
npm run db:migrate
npm run db:deploy
npm run db:push
npm run db:seed
npm run db:setup
npm run db:studio
```

Seed membuat admin awal dari env dan data demo sebagai `ContentItem` draft.

Seed juga membuat data QA end-to-end untuk semua modul:

- `creator@content-monitor.local` / `CreatorPassword123!`
- `buyer@content-monitor.local` / `BuyerPassword123!`
- `partner@content-monitor.local` / `PartnerPassword123!`
- `inactive@content-monitor.local` / `InactivePassword123!`

Skenario lengkapnya ada di [docs/qa-scenarios.md](docs/qa-scenarios.md).

## Modul Aplikasi

- `/events`: scheduler calendar untuk konten.
- `/bank-konten/*`: CRUD konten berdasarkan format.
- `/produk/e-book`: produk e-book, upload PDF private, preview, dan download setelah paid.
- `/produk/course`: course builder, module, lesson, resource, quiz, dan preview creator.
- `/appearance`: builder halaman publik `/{username}`.
- `/statistics`: statistik user untuk view, click, checkout, revenue, course progress, dan quiz.
- `/payment`: dashboard order penjualan/pembelian dan status payment user.
- `/account`: profile, username publik, avatar, timezone, logout, dan ganti password.
- `/learn`: learner area untuk course yang sudah dibeli.
- `/admin/*`: user management, moderation, order/payment monitoring, settings, audit log, dan platform statistics.

## Payment

Flow checkout saat ini:

```text
Public product/course page
-> checkout tRPC
-> Midtrans Snap
-> webhook /api/payment/webhook
-> order status update
-> e-book download atau course enrollment
```

Midtrans production/sandbox tetap dikontrol dari `/admin/settings` dan environment server. Refund admin belum menjadi scope MVP; refund dilakukan manual dari dashboard provider sampai contract refund, idempotency, audit log, dan status sync siap.

## Verifikasi

Quality gate utama:

```bash
npm run guardrails
npm run lint
npm run typecheck
npm run build
npm run smoke:auth
```

`npm run smoke:auth` membuat/memperbarui user smoke lokal, menjalankan `next start` sementara, mengecek login credentials, protected route `/account`, tRPC `account` dan `payments`, forgot/reset password, lalu mengembalikan password smoke user. Script ini hanya menulis otomatis ke `DATABASE_URL=file:*` kecuali `SMOKE_ALLOW_DB_WRITE=true`.

`npm audit` masih menyisakan advisory transitive dari `next-auth@4.24.14`/`uuid@8.3.2`. Jangan jalankan `npm audit fix --force` tanpa review karena bisa menyarankan downgrade atau breaking change.
