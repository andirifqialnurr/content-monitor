import { PaymentOrderStatus } from "@/components/payments/payment-order-status";

export default async function PaymentOrderStatusPage({ params }) {
  const resolvedParams = await params;

  return <PaymentOrderStatus orderId={resolvedParams["order-id"]} />;
}
