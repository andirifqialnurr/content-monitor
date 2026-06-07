import { Badge } from "@/components/ui/badge";

const statusVariants = {
  ACTIVE: "secondary",
  INACTIVE: "destructive",
  APPROVED: "secondary",
  REVIEW_REQUIRED: "outline",
  DISABLED: "destructive",
  ADMIN: "secondary",
  USER: "outline",
  PAID: "secondary",
  PENDING: "outline",
  FAILED: "destructive",
  EXPIRED: "outline",
  REFUNDED: "outline",
  REVOKED: "destructive",
  DRAFT: "outline",
  INACTIVE: "outline",
};

export function AdminStatusBadge({ status }) {
  return <Badge variant={statusVariants[status] ?? "outline"}>{status}</Badge>;
}

export function formatPrice(price, currency = "IDR") {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatPerson(user, fallbackEmail) {
  if (!user) {
    return fallbackEmail ?? "-";
  }

  return user.name ?? user.username ?? user.email ?? fallbackEmail ?? "-";
}
