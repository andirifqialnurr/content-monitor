# Content Monitor

Dashboard Next.js untuk memantau timeline publikasi dan bank topik kanal IT.

UI memakai shadcn/ui style components, Radix primitives, Tailwind CSS, dan lucide-react.

## Jalankan

```bash
bun install
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
