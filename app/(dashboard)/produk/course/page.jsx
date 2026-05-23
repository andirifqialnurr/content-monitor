import { ProductManager } from "@/components/products/product-manager";

export default function CoursePage() {
  return (
    <ProductManager
      type="COURSE"
      eyebrow="Produk"
      title="Course"
      description="Course builder untuk module, lesson bacaan/video, quiz, tools, dokumentasi resmi, dan resource pendukung."
    />
  );
}
