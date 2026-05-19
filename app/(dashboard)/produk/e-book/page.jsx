import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function EBookPage() {
  return (
    <ModulePlaceholder
      eyebrow="Produk"
      title="E-book"
      description="Produk file digital yang bisa diupload, dipreview, dijual, dan dibuka setelah order paid."
      items={["Nama produk", "Deskripsi", "Harga", "Cover image", "Upload file e-book", "Preview/viewer", "Download setelah paid"]}
    />
  );
}
