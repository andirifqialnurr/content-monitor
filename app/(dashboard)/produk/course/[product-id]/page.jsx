import { ProductDetail } from "@/components/products/product-detail";

export default async function CourseProductDetailPage({ params }) {
  const resolvedParams = await params;

  return <ProductDetail productId={resolvedParams["product-id"]} expectedType="COURSE" />;
}
