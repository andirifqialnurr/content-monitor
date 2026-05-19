import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function AdminPaymentsPage() {
  return (
    <ModulePlaceholder
      eyebrow="Admin"
      title="Payments"
      description="Monitoring transaksi payment gateway, webhook, dan status provider."
      items={["Provider reference", "Webhook status", "Transaction status", "Failure reason", "Reconcile"]}
    />
  );
}
