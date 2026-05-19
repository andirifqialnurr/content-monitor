# Content Monitor

Dashboard Next.js untuk memantau timeline publikasi dan bank topik kanal IT.

UI memakai shadcn/ui style components, Radix primitives, Tailwind CSS, dan lucide-react.

## Jalankan

```bash
bun install
bun run db:setup
bun run dev
```

Jika `bun install` menggantung di Windows, gunakan opsi konservatif ini:

```bash
bun install --no-progress --ignore-scripts --network-concurrency=4 --backend=copyfile --registry=https://registry.npmjs.org
```

Default URL:

```text
http://127.0.0.1:4000
```

## Database

Project memakai Prisma + SQLite lokal. Credential/koneksi database disimpan di `.env`:

```env
DATABASE_URL="file:./prisma/dev.db"
```

`.env` dan file database lokal `prisma/dev.db` diabaikan oleh Git. Gunakan `.env.example` sebagai template environment.

Script yang tersedia:

```bash
bun run db:generate
bun run db:migrate
bun run db:deploy
bun run db:push
bun run db:seed
bun run db:setup
bun run db:studio
```

Seed mengambil data awal dari `data/content.js` dan mengisi tabel topik, timeline, format konten, cadence, kalender mingguan, dan referensi markdown.

Jika muncul error chunk `.next` seperti `Cannot find module './611.js'`, hentikan dev server lalu jalankan:

```bash
bun run dev:clean
```

Jangan menjalankan `bun run build` saat `bun run dev` masih aktif, karena cache `.next` bisa bentrok.

## Isi Dashboard

- Timeline 12 pekan dengan checklist per format.
- Target frekuensi posting minimum, normal, dan stretch.
- Kalender publish mingguan.
- Bank topik dengan search dan filter.
- Detail angle untuk carousel, video pendek, blog/Medium, dan LinkedIn.

Status checklist disimpan di `localStorage` browser.
