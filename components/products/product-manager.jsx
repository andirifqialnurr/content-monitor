"use client";

import Link from "next/link";
import { BookOpen, FileText, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { trpc } from "@/lib/trpc/react";

const statusOptions = [
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

const statusLabels = Object.fromEntries(statusOptions.map((status) => [status.value, status.label]));

export function ProductManager({ type, eyebrow, title, description }) {
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

  const products = trpc.products.list.useQuery(listInput);
  const createMutation = trpc.products.create.useMutation({
    onSuccess: () => utils.products.list.invalidate(),
  });
  const updateMutation = trpc.products.update.useMutation({
    onSuccess: () => utils.products.list.invalidate(),
  });
  const deleteMutation = trpc.products.delete.useMutation({
    onSuccess: () => utils.products.list.invalidate(),
  });

  function handleCreate(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    createMutation.mutate(
      {
        type,
        title: String(formData.get("title") ?? ""),
        slug: String(formData.get("slug") ?? ""),
        description: String(formData.get("description") ?? ""),
        price: Number(formData.get("price") ?? 0),
        currency: String(formData.get("currency") ?? "IDR"),
        coverUrl: String(formData.get("coverUrl") ?? ""),
        fileUrl: type === "EBOOK" ? String(formData.get("fileUrl") ?? "") : "",
        status: String(formData.get("status") ?? "DRAFT"),
      },
      {
        onSuccess: () => form.reset(),
      },
    );
  }

  return (
    <div className="grid gap-4">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />

      <Card>
        <CardHeader>
          <CardDescription>Tambah produk</CardDescription>
          <CardTitle className="text-lg">Produk Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3" onSubmit={handleCreate}>
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_160px_140px]">
              <Input name="title" placeholder="Nama produk" required />
              <Input name="slug" placeholder="slug-produk" />
              <Input name="price" min="0" step="1000" type="number" placeholder="Harga" defaultValue="0" />
              <Input name="currency" maxLength={3} defaultValue="IDR" aria-label="Currency" />
            </div>
            <textarea
              name="description"
              placeholder="Deskripsi produk"
              className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_180px_auto]">
              <Input name="coverUrl" placeholder="Cover image URL atau path internal" />
              {type === "EBOOK" ? (
                <Input name="fileUrl" placeholder="File e-book URL atau path internal" />
              ) : (
                <div className="hidden lg:block" />
              )}
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
              <Button type="submit" disabled={createMutation.isPending}>
                <Plus className="size-4" />
                Tambah
              </Button>
            </div>
            {createMutation.error && <p className="text-sm text-destructive">{createMutation.error.message}</p>}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardDescription>Daftar produk</CardDescription>
            <CardTitle className="text-lg">{products.data?.length ?? 0} item</CardTitle>
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
          {products.isLoading && <p className="text-sm text-muted-foreground">Memuat produk...</p>}
          {products.data?.length === 0 && <p className="text-sm text-muted-foreground">Belum ada produk.</p>}
          {products.data?.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              onStatusChange={(nextStatus) => updateMutation.mutate({ id: product.id, status: nextStatus })}
              onDelete={() => {
                if (window.confirm(`Hapus ${product.title}?`)) {
                  deleteMutation.mutate({ id: product.id });
                }
              }}
            />
          ))}
          {(updateMutation.error || deleteMutation.error) && (
            <p className="text-sm text-destructive">{updateMutation.error?.message ?? deleteMutation.error?.message}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProductRow({ product, onStatusChange, onDelete }) {
  const detailPath = product.type === "EBOOK" ? `/produk/e-book/${product.id}` : `/produk/course/${product.id}`;
  const ProductIcon = product.type === "EBOOK" ? FileText : BookOpen;

  return (
    <article className="grid gap-3 rounded-md border bg-muted/20 p-3 lg:grid-cols-[minmax(0,1fr)_160px_160px_auto] lg:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <ProductIcon className="size-4 text-muted-foreground" />
          <h2 className="font-semibold">{product.title}</h2>
          <Badge variant="secondary">{statusLabels[product.status] ?? product.status}</Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">/{product.slug}</p>
        {product.description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>}
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>{formatPrice(product.price, product.currency)}</span>
          {product.type === "COURSE" && <span>{product._count.modules} module</span>}
          <span>{product._count.orders} order</span>
        </div>
      </div>

      <Select value={product.status} onValueChange={onStatusChange}>
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

      <Button asChild variant="outline">
        <Link href={detailPath}>Detail</Link>
      </Button>

      <Button variant="outline" size="icon" onClick={onDelete} aria-label={`Hapus ${product.title}`}>
        <Trash2 className="size-4" />
      </Button>
    </article>
  );
}

function formatPrice(price, currency) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}
