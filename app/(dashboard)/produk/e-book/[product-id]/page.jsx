import { ProductDetail } from "@/components/products/product-detail";

export default async function EBookProductDetailPage({ params }) {
  const resolvedParams = await params;

  return <ProductDetail productId={resolvedParams["product-id"]} expectedType="EBOOK" />;
}
