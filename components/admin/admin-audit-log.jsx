import { ShieldCheck } from "lucide-react";
import { formatDateTime, formatPerson } from "@/components/admin/admin-shared";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AdminAuditLog({ logs }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Audit trail terbaru</CardDescription>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShieldCheck className="size-4 text-muted-foreground" />
          {logs.length} Audit
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada audit log admin.</p>
        ) : (
          logs.map((log) => <AuditRow key={log.id} log={log} />)
        )}
      </CardContent>
    </Card>
  );
}

function AuditRow({ log }) {
  const metadata = parseMetadata(log.metadataJson);

  return (
    <article className="grid gap-2 rounded-md border bg-muted/20 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{formatAction(log.action)}</Badge>
        <span className="text-sm font-medium">{formatTarget(log)}</span>
      </div>
      <div className="grid gap-1 text-xs text-muted-foreground md:grid-cols-2">
        <span>Actor: {formatPerson(log.actor)}</span>
        <span>At: {formatDateTime(log.createdAt)}</span>
        {metadata.previousStatus && <span>From: {metadata.previousStatus}</span>}
        {metadata.nextStatus && <span>To: {metadata.nextStatus}</span>}
      </div>
    </article>
  );
}

function formatAction(action) {
  if (action === "USER_STATUS_UPDATED") {
    return "User status";
  }

  if (action === "PRODUCT_MODERATION_UPDATED") {
    return "Product moderation";
  }

  return action;
}

function formatTarget(log) {
  if (log.targetUser) {
    return formatPerson(log.targetUser);
  }

  if (log.targetProduct) {
    return log.targetProduct.title;
  }

  return "Target removed";
}

function parseMetadata(value) {
  if (!value) {
    return {};
  }

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}
