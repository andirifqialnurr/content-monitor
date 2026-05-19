"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc/react";

const contentTypes = [
  { value: "VIDEO_SHORT", label: "Video Short" },
  { value: "CAROUSEL_POST", label: "Carousel Post" },
  { value: "BLOG", label: "Blog" },
  { value: "LONG_VIDEO", label: "Long Video" },
];

export function EventsQuickCreateForm() {
  const utils = trpc.useUtils();
  const createMutation = trpc.contentItems.create.useMutation({
    onSuccess: () => utils.contentItems.list.invalidate(),
  });

  function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    createMutation.mutate({
      type: String(formData.get("type") ?? "VIDEO_SHORT"),
      title: String(formData.get("title") ?? ""),
      body: String(formData.get("body") ?? ""),
      status: "SCHEDULED",
      scheduledAt: String(formData.get("scheduledAt") ?? ""),
    });

    event.currentTarget.reset();
  }

  return (
    <Card>
      <CardHeader>
        <CardDescription>Events</CardDescription>
        <CardTitle>Tambah Event Konten</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3 xl:grid-cols-[220px_1fr_220px_auto]" onSubmit={handleSubmit}>
          <Select name="type" defaultValue="VIDEO_SHORT">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {contentTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input name="title" placeholder="Judul event konten" required />
          <Input name="scheduledAt" type="datetime-local" required />
          <Button type="submit" disabled={createMutation.isPending}>
            <Plus className="size-4" />
            Tambah
          </Button>

          <textarea
            name="body"
            placeholder="Catatan event, angle, CTA, atau brief produksi"
            className="min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm xl:col-span-4"
          />
        </form>
      </CardContent>
    </Card>
  );
}
