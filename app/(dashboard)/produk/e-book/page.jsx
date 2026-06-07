import { ProductManager } from "@/components/products/product-manager";

export default function EBookPage() {
  return (
    <ProductManager
      type="EBOOK"
      eyebrow="Produk"
      title="E-book"
      description="Produk file digital yang bisa diupload, dipreview, dijual, dan dibuka setelah order paid."
    />
  );
}
