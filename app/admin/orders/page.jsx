import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function AdminOrdersPage() {
  return (
    <ModulePlaceholder
      eyebrow="Admin"
      title="Orders"
      description="Monitoring order lintas platform untuk investigasi transaksi dan akses produk."
      items={["Order list", "Buyer", "Creator", "Product", "Payment status", "Enrollment status"]}
    />
  );
}
