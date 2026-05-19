import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function AdminProductsPage() {
  return (
    <ModulePlaceholder
      eyebrow="Admin"
      title="Products"
      description="Monitoring dan moderasi produk e-book maupun course lintas platform."
      items={["Product list", "Course list", "Moderation status", "Creator owner", "Disable product"]}
    />
  );
}
