import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function PaymentPage() {
  return (
    <ModulePlaceholder
      eyebrow="Checkout"
      title="Payment"
      description="Konfigurasi provider payment, checkout produk, webhook, order lifecycle, dan enrollment otomatis."
      items={["Midtrans sandbox", "Payment provider adapter", "Checkout", "Webhook", "Order status", "Enrollment after paid"]}
    />
  );
}
