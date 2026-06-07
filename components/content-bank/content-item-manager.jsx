"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Plus, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { trpc } from "@/lib/trpc/react";

const statusOptions = [
  { value: "DRAFT", label: "Draft" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

const statusLabels = Object.fromEntries(statusOptions.map((status) => [status.value, status.label]));

export function ContentItemManager({ type, eyebrow, title, description, bodyLabel = "Catatan" }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const utils = trpc.useUtils();

  const listInput = useMemo(
    () => ({
      type,
      query: query.trim() || undefined,
      status: status === "ALL" ? undefined : status,
    }),
    [query, status, type],
  );

  const contentItems = trpc.contentItems.list.useQuery(listInput);
  const createMutation = trpc.contentItems.create.useMutation({
    onSuccess: () => utils.contentItems.list.invalidate(),
  });
  const updateMutation = trpc.contentItems.update.useMutation({
    onSuccess: () => utils.contentItems.list.invalidate(),
  });
  const deleteMutation = trpc.contentItems.delete.useMutation({
    onSuccess: () => utils.contentItems.list.invalidate(),
  });

  function handleCreate(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    createMutation.mutate({
      type,
      title: String(formData.get("title") ?? ""),
      body: String(formData.get("body") ?? ""),
      status: String(formData.get("status") ?? "DRAFT"),
      scheduledAt: String(formData.get("scheduledAt") ?? ""),
    });

    event.currentTarget.reset();
  }

  return (
    <div className="grid gap-4">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />

      <Card>
        <CardHeader>
          <CardDescription>Tambah item</CardDescription>
          <CardTitle className="text-lg">Draft Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 lg:grid-cols-[1fr_180px_220px_auto]" onSubmit={handleCreate}>
            <Input name="title" placeholder="Judul konten" required />
            <select
              name="status"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              defaultValue="DRAFT"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Input name="scheduledAt" type="datetime-local" />
            <Button type="submit" disabled={createMutation.isPending}>
              <Plus className="size-4" />
              Tambah
            </Button>
            <textarea
              name="body"
              placeholder={bodyLabel}
              className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm lg:col-span-4"
            />
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardDescription>Daftar konten</CardDescription>
            <CardTitle className="text-lg">{contentItems.data?.length ?? 0} item</CardTitle>
          </div>
          <div className="grid gap-2 md:grid-cols-[260px_170px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Cari..." value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua status</SelectItem>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3">
          {contentItems.isLoading && <p className="text-sm text-muted-foreground">Memuat konten...</p>}
          {contentItems.data?.length === 0 && <p className="text-sm text-muted-foreground">Belum ada konten.</p>}

          {contentItems.data?.map((item) => (
            <ContentItemRow
              key={item.id}
              item={item}
              onStatusChange={(nextStatus) => updateMutation.mutate({ id: item.id, status: nextStatus })}
              onDelete={() => deleteMutation.mutate({ id: item.id })}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ContentItemRow({ item, onStatusChange, onDelete }) {
  return (
    <article className="grid gap-3 rounded-md border bg-muted/20 p-3 md:grid-cols-[minmax(0,1fr)_170px_auto] md:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold">{item.title}</h2>
          <Badge variant="secondary">{statusLabels[item.status] ?? item.status}</Badge>
        </div>
        {item.body && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.body}</p>}
        {item.scheduledAt && (
          <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarClock className="size-3.5" />
            {new Date(item.scheduledAt).toLocaleString("id-ID")}
          </p>
        )}
      </div>

      <Select value={item.status} onValueChange={onStatusChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button variant="outline" size="icon" onClick={onDelete} aria-label={`Hapus ${item.title}`}>
        <Trash2 className="size-4" />
      </Button>
    </article>
  );
}
