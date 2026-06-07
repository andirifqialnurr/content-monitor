"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, Download, ExternalLink, Eye, FileText, Save, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CourseBuilder } from "@/components/courses/course-builder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/page-header";
import { trpc } from "@/lib/trpc/react";

const statusOptions = [
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

const statusLabels = Object.fromEntries(statusOptions.map((status) => [status.value, status.label]));

export function ProductDetail({ productId, expectedType }) {
  const utils = trpc.useUtils();
  const product = trpc.products.get.useQuery({ id: productId });
  const updateMutation = trpc.products.update.useMutation({
    onSuccess: async () => {
      await utils.products.get.invalidate({ id: productId });
      await utils.products.list.invalidate();
    },
  });

  if (product.isLoading) {
    return <p className="text-sm text-muted-foreground">Memuat produk...</p>;
  }

  if (product.error) {
    return <p className="text-sm text-destructive">{product.error.message}</p>;
  }

  const data = product.data;
  const backPath = data.type === "EBOOK" ? "/produk/e-book" : "/produk/course";
  const ProductIcon = data.type === "EBOOK" ? FileText : BookOpen;
  const hasPrivateFile = isPrivateFileUrl(data.fileUrl);

  async function handleFileUploaded() {
    await utils.products.get.invalidate({ id: productId });
    await utils.products.list.invalidate();
  }

  return (
    <div className="grid gap-4">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-3">
          <Link href={backPath}>
            <ArrowLeft className="size-4" />
            Kembali
          </Link>
        </Button>
        <PageHeader
          eyebrow={data.type === "EBOOK" ? "Produk / E-book" : "Produk / Course"}
          title={data.title}
          description={data.description}
          badge={statusLabels[data.status] ?? data.status}
        />
      </div>

      {data.type !== expectedType && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Produk ini berada di kategori {data.type === "EBOOK" ? "E-book" : "Course"}.
          </CardContent>
        </Card>
      )}

      <div className={data.type === "EBOOK" ? "grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]" : "grid gap-4"}>
        <Card>
          <CardHeader>
            <CardDescription>Metadata produk</CardDescription>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ProductIcon className="size-4 text-muted-foreground" />
              Detail
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProductMetadataForm data={data} hasPrivateFile={hasPrivateFile} updateMutation={updateMutation} />
          </CardContent>
        </Card>

        {data.type === "EBOOK" ? (
          <ProductPreview product={data} onFileUploaded={handleFileUploaded} />
        ) : (
          <CourseBuilder product={data} />
        )}
      </div>
    </div>
  );
}

function ProductPreview({ product, onFileUploaded }) {
  const fileAccessUrl = getProductFileAccessUrl(product);
  const downloadUrl = isPrivateFileUrl(product.fileUrl) ? `${fileAccessUrl}?download=1` : fileAccessUrl;

  return (
    <Card>
      <CardHeader>
        <CardDescription>Preview e-book</CardDescription>
        <CardTitle className="text-lg">Viewer File</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <EBookUpload productId={product.id} onUploaded={onFileUploaded} />

        {fileAccessUrl ? (
          <>
            <p className="text-xs text-muted-foreground">
              Sumber file: {isPrivateFileUrl(product.fileUrl) ? "Private storage" : product.fileUrl}
            </p>
            <div className="overflow-hidden rounded-md border bg-muted/20">
              <iframe src={fileAccessUrl} title={`Preview ${product.title}`} className="h-[520px] w-full bg-background" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <a href={fileAccessUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4" />
                  Buka file
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={downloadUrl} target="_blank" rel="noreferrer">
                  <Download className="size-4" />
                  Download
                </a>
              </Button>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">File e-book belum diisi.</p>
        )}
      </CardContent>
    </Card>
  );
}

function ProductMetadataForm({ data, hasPrivateFile, updateMutation }) {
  const [form, setForm] = useState(() => productToFormState(data, hasPrivateFile));

  useEffect(() => {
    setForm(productToFormState(data, hasPrivateFile));
  }, [data.id, data.updatedAt, hasPrivateFile, data]);

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleUpdate(event) {
    event.preventDefault();

    updateMutation.mutate({
      id: data.id,
      title: form.title,
      slug: form.slug,
      description: form.description,
      price: Number(form.price || 0),
      currency: form.currency,
      coverUrl: form.coverUrl,
      fileUrl: hasPrivateFile && !form.fileUrl ? data.fileUrl : form.fileUrl,
      status: form.status,
    });
  }

  return (
    <form key={data.id} className="grid gap-3" onSubmit={handleUpdate}>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
        <Input
          name="title"
          value={form.title}
          onChange={(event) => updateField("title", event.target.value)}
          placeholder="Nama produk"
          required
        />
        <Input
          name="slug"
          value={form.slug}
          onChange={(event) => updateField("slug", event.target.value)}
          placeholder="slug-produk"
          required
        />
      </div>
      <textarea
        name="description"
        value={form.description}
        onChange={(event) => updateField("description", event.target.value)}
        placeholder="Deskripsi produk"
        className="min-h-32 rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
      <div className="grid gap-3 md:grid-cols-[1fr_140px_140px]">
        <Input
          name="price"
          min="0"
          step="1000"
          type="number"
          value={form.price}
          onChange={(event) => updateField("price", event.target.value)}
          placeholder="Harga"
        />
        <Input
          name="currency"
          maxLength={3}
          value={form.currency}
          onChange={(event) => updateField("currency", event.target.value)}
          aria-label="Currency"
        />
        <select
          name="status"
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={form.status}
          onChange={(event) => updateField("status", event.target.value)}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <Input
        name="coverUrl"
        value={form.coverUrl}
        onChange={(event) => updateField("coverUrl", event.target.value)}
        placeholder="Cover image URL atau path internal"
      />
      <Input
        name="fileUrl"
        value={form.fileUrl}
        onChange={(event) => updateField("fileUrl", event.target.value)}
        placeholder={data.type === "EBOOK" ? "URL file eksternal, atau upload PDF di panel kanan" : "File produk URL atau path internal"}
      />
      {hasPrivateFile && (
        <p className="text-xs text-muted-foreground">
          File e-book tersimpan di private storage. Kosongkan field ini saat menyimpan metadata agar file tetap dipakai.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={updateMutation.isPending}>
          <Save className="size-4" />
          Simpan
        </Button>
        <Badge variant="secondary">{formatPrice(data.price, data.currency)}</Badge>
        <Badge variant="outline">{data._count.orders} order</Badge>
        {data.type === "COURSE" && <Badge variant="outline">{data._count.modules} module</Badge>}
        {data.type === "COURSE" && (
          <Button asChild variant="outline">
            <Link href={`/produk/course/${data.id}/preview`}>
              <Eye className="size-4" />
              Preview course
            </Link>
          </Button>
        )}
      </div>
      {updateMutation.error && <p className="text-sm text-destructive">{updateMutation.error.message}</p>}
    </form>
  );
}

function productToFormState(product, hasPrivateFile) {
  return {
    title: product.title,
    slug: product.slug,
    description: product.description ?? "",
    price: String(product.price),
    currency: product.currency,
    coverUrl: product.coverUrl ?? "",
    fileUrl: hasPrivateFile ? "" : product.fileUrl ?? "",
    status: product.status,
  };
}

function EBookUpload({ productId, onUploaded }) {
  const formRef = useRef(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  async function handleUpload(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      setError("Pilih file PDF terlebih dahulu.");
      return;
    }

    setIsUploading(true);

    try {
      const response = await fetch(`/api/products/${productId}/ebook-file`, {
        method: "POST",
        body: formData,
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message ?? "Upload file e-book gagal.");
      }

      formRef.current?.reset();
      setMessage(`${result.fileName} tersimpan di private storage.`);
      await onUploaded?.();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload file e-book gagal.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form ref={formRef} className="grid gap-2 rounded-md border bg-muted/20 p-3" onSubmit={handleUpload}>
      <Input name="file" type="file" accept="application/pdf,.pdf" />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={isUploading}>
          <Upload className="size-4" />
          {isUploading ? "Mengupload..." : "Upload PDF"}
        </Button>
        <span className="text-xs text-muted-foreground">PDF maksimal 25 MB.</span>
      </div>
      {message && <p className="text-sm text-emerald-700">{message}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}

function getProductFileAccessUrl(product) {
  if (!product.fileUrl) {
    return null;
  }

  if (isPrivateFileUrl(product.fileUrl)) {
    return `/api/products/${product.id}/ebook-file`;
  }

  return product.fileUrl;
}

function isPrivateFileUrl(value) {
  return Boolean(value?.startsWith("private://"));
}

function formatPrice(price, currency) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}
