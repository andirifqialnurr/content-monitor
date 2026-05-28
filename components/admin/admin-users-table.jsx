import { Users } from "lucide-react";
import { UserStatusControl } from "@/components/admin/admin-moderation-controls";
import { AdminStatusBadge, formatDateTime } from "@/components/admin/admin-shared";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AdminUsersTable({ users }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>User terbaru</CardDescription>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="size-4 text-muted-foreground" />
          {users.length} User
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada user.</p>
        ) : (
          users.map((user) => <UserRow key={user.id} user={user} />)
        )}
      </CardContent>
    </Card>
  );
}

function UserRow({ user }) {
  return (
    <article className="grid gap-3 rounded-md border bg-muted/20 p-3 xl:grid-cols-[minmax(0,1fr)_140px_140px_140px] xl:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <AdminStatusBadge status={user.role} />
          <AdminStatusBadge status={user.status} />
          <h2 className="truncate font-semibold">{user.name ?? user.username}</h2>
          <span className="text-xs text-muted-foreground">#{user.username}</span>
        </div>
        <div className="mt-2 grid gap-1 text-xs text-muted-foreground md:grid-cols-2">
          <span>{user.email}</span>
          <span>Joined: {formatDateTime(user.createdAt)}</span>
          <span>Public page: {user.publicPage?.isPublished ? "Published" : "Draft/none"}</span>
          <span>Timezone: {user.timezone}</span>
        </div>
      </div>

      <Summary label="Content" value={user._count.contentItems} />
      <Summary label="Products" value={user._count.products} />
      <Summary label="Orders" value={user._count.createdOrders} />
      <div>
        <UserStatusControl userId={user.id} status={user.status} />
      </div>
      <div className="xl:col-span-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{user._count.learnerEnrollments} enrollment belajar</Badge>
          {user.avatarUrl && <Badge variant="outline">Avatar set</Badge>}
        </div>
      </div>
    </article>
  );
}

function Summary({ label, value }) {
  return (
    <div className="rounded-md border bg-background p-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}
