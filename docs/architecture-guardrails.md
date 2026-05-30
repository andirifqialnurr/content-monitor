# Architecture Guardrails

Dokumen ini adalah guard wajib untuk implementasi `content-monitor`. Tujuannya menjaga arsitektur tetap rapi saat fitur bertambah besar.

## Prinsip Utama

- API internal memakai tRPC sebagai gerbang utama.
- Route handler hanya menjadi gateway/wiring, bukan tempat logic bisnis.
- Logic bisnis dipisah ke file `.ts` berdasarkan domain.
- File backend maksimal 500 baris.
- File frontend maksimal 1000 baris.
- Page hanya menyusun komponen, bukan menampung UI besar.
- Komponen reusable wajib punya tempat pengaturan variant.
- Penamaan file konsisten memakai kebab-case.
- Security check dan ownership check wajib sejak awal.
- Implementasi mengikuti SOLID secara pragmatis.

## Struktur Backend

Struktur target:

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

tRPC gateway:

```text
app/api/trpc/[trpc]/route.ts
```

Aturan backend:

- `*.router.ts` hanya mendefinisikan procedure tRPC dan memanggil service.
- `*.service.ts` berisi logic bisnis.
- `*.repository.ts` berisi akses database.
- `*.schema.ts` berisi validasi input/output.
- `*.policy.ts` berisi authorization dan ownership rules.
- Route webhook eksternal boleh memakai Next.js route handler, tetapi logic tetap masuk service.

## Struktur Frontend

Struktur target:

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

Aturan frontend:

- Buat component dulu sebelum menyusun halaman.
- Page hanya orchestration: layout, data entry point, dan komposisi component.
- Form besar dipisah menjadi component.
- Table/list besar dipisah menjadi component.
- Dialog/modal dipisah menjadi component.
- State kompleks dipisah menjadi hook `use-*.ts`.
- Component reusable memakai variant system, misalnya `class-variance-authority`.

Contoh:

```text
components/courses/course-card.tsx
components/courses/course-form.tsx
components/courses/course-builder-shell.tsx
components/courses/lesson-resource-list.tsx
components/shared/status-badge.tsx
components/shared/data-table.tsx
```

## Penamaan File

Aturan:

- File dan folder baru memakai kebab-case.
- Component React tetap diexport dengan PascalCase.
- Hook memakai format `use-*.ts`.
- Test memakai format `*.test.ts` atau `*.test.tsx`.
- Router tRPC memakai `domain.router.ts`.
- Service memakai `domain.service.ts`.
- Repository memakai `domain.repository.ts`.
- Schema memakai `domain.schema.ts`.
- Policy memakai `domain.policy.ts`.

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

## Security Baseline

Checklist wajib:

- Semua tRPC mutation wajib validasi input.
- Gunakan schema validation, misalnya Zod.
- Jangan percaya `userId` dari client; ambil dari session server.
- Semua data milik user wajib ownership check.
- Route `/admin/*` wajib role `ADMIN`.
- Route learner wajib enrollment guard.
- Payment webhook wajib verifikasi signature/provider payload.
- File upload wajib validasi MIME type, ekstensi, ukuran, dan ownership.
- File digital private tidak boleh dibuka dengan URL publik tanpa authorization.
- Secret hanya disimpan di server/env.
- Jangan log password, token, payment payload sensitif, atau private file URL.
- Tambahkan rate limiting untuk auth, checkout, tracking publik, dan mutation sensitif.
- Error message tidak boleh membocorkan detail internal.

## Ownership Audit

Status audit 2026-05-30:

- Dashboard content/product mutation memakai `ctx.user.id` dari `protectedProcedure`, bukan `userId` dari client.
- `ContentItem`, `Product`, Course Builder, dan Appearance/PublicPageBlock memiliki policy ownership sebelum update/delete.
- Update block Appearance wajib memvalidasi target produk/konten berdasarkan tipe block efektif, termasuk saat `type` tidak dikirim ulang.
- Learner route memakai enrollment guard sebelum membuka lesson, progress, atau quiz attempt.
- Payment order hanya bisa dibaca buyer atau creator terkait.
- File e-book private hanya bisa dibuka owner produk atau buyer dengan order `PAID`.
- Statistik user difilter berdasarkan owner/creator `userId`.
- Public page dan analytics tracking hanya merender/mencatat target publik yang masih aktif: produk `ACTIVE` non-disabled dan konten `PUBLISHED`.

## SOLID Guard

Penerapan:

- Single Responsibility: router, service, repository, schema, dan policy punya tugas terpisah.
- Open/Closed: payment provider memakai adapter agar provider baru bisa ditambah.
- Liskov Substitution: setiap payment provider mengikuti contract yang sama.
- Interface Segregation: pisahkan contract payment, storage, analytics, dan notification.
- Dependency Inversion: service bergantung ke contract/adapter, bukan implementasi vendor langsung.

Contoh:

- `payments.service.ts` memanggil `payment-provider.ts`, bukan langsung SDK Midtrans.
- `courses.service.ts` memanggil `courses.repository.ts`, bukan Prisma langsung di semua tempat.
- `courses.policy.ts` menangani akses creator, learner, dan admin.
- `storage.service.ts` menangani upload dan signed access untuk file private.

## Automated Guard

Jalankan:

```bash
bun run guardrails
```

atau:

```bash
node scripts/check-guardrails.mjs
```

Guard otomatis saat ini mengecek:

- File backend tidak lebih dari 500 baris.
- File frontend tidak lebih dari 1000 baris.
- File/folder source memakai kebab-case.
- Struktur tRPC diberi advisory sampai implementasi tRPC dimulai.

Hal yang tetap perlu review manual:

- Kualitas SOLID.
- Kualitas pemecahan component.
- Security flow.
- Ownership check untuk endpoint baru setelah audit 2026-05-30.
- Validasi payment webhook.
