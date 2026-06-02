"use client";

import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Eye,
  Link as LinkIcon,
  Palette,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { trpc } from "@/lib/trpc/react";

const blockTypeOptions = [
  { value: "LINK", label: "Link" },
  { value: "PRODUCT", label: "Produk" },
  { value: "CONTENT", label: "Konten" },
  { value: "CTA", label: "CTA" },
];

const buttonStyleOptions = [
  { value: "SOLID", label: "Solid" },
  { value: "OUTLINE", label: "Outline" },
  { value: "SOFT", label: "Soft" },
];

const themePresets = [
  {
    name: "Studio",
    backgroundColor: "#f8fafc",
    textColor: "#0f172a",
    buttonStyle: "SOLID",
  },
  {
    name: "Mint",
    backgroundColor: "#ecfdf5",
    textColor: "#064e3b",
    buttonStyle: "SOFT",
  },
  {
    name: "Mono",
    backgroundColor: "#111827",
    textColor: "#f9fafb",
    buttonStyle: "OUTLINE",
  },
];

export function AppearanceEditor() {
  const utils = trpc.useUtils();
  const appearance = trpc.appearance.get.useQuery();
  const updatePageMutation = trpc.appearance.updatePage.useMutation({
    onSuccess: () => utils.appearance.get.invalidate(),
  });
  const createBlockMutation = trpc.appearance.createBlock.useMutation({
    onSuccess: () => utils.appearance.get.invalidate(),
  });
  const updateBlockMutation = trpc.appearance.updateBlock.useMutation({
    onSuccess: () => utils.appearance.get.invalidate(),
  });
  const deleteBlockMutation = trpc.appearance.deleteBlock.useMutation({
    onSuccess: () => utils.appearance.get.invalidate(),
  });
  const moveBlockMutation = trpc.appearance.moveBlock.useMutation({
    onSuccess: () => utils.appearance.get.invalidate(),
  });
  const [blockType, setBlockType] = useState("LINK");
  const [pageDraft, setPageDraft] = useState(null);

  useEffect(() => {
    if (!appearance.data) {
      return;
    }

    setPageDraft(createPageDraft(appearance.data.publicPage));
  }, [appearance.data?.publicPage.id, appearance.data?.publicPage.updatedAt]);

  if (appearance.isLoading) {
    return <p className="text-sm text-muted-foreground">Memuat appearance...</p>;
  }

  if (appearance.error) {
    return <p className="text-sm text-destructive">{appearance.error.message}</p>;
  }

  const data = appearance.data;
  const publicPage = data.publicPage;
  const draft = pageDraft ?? createPageDraft(publicPage);
  const draftPublicPage = {
    ...publicPage,
    displayName: draft.displayName,
    bio: draft.bio,
    isPublished: draft.isPublished,
    themeJson: JSON.stringify(draft.theme),
  };
  const publicUrl = `/${data.user.username}`;

  function updatePageDraft(patch) {
    setPageDraft((current) => ({
      ...(current ?? createPageDraft(publicPage)),
      ...patch,
    }));
  }

  function updateThemeDraft(patch) {
    setPageDraft((current) => {
      const nextDraft = current ?? createPageDraft(publicPage);

      return {
        ...nextDraft,
        theme: {
          ...nextDraft.theme,
          ...patch,
        },
      };
    });
  }

  function handleUpdatePage(event) {
    event.preventDefault();

    updatePageMutation.mutate({
      displayName: draft.displayName,
      bio: draft.bio,
      isPublished: draft.isPublished,
      theme: draft.theme,
    });
  }

  function handleCreateBlock(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const type = String(formData.get("type") ?? "LINK");
    const productId = normalizedOptionalValue(formData.get("productId"));
    const contentItemId = normalizedOptionalValue(formData.get("contentItemId"));
    const url = normalizedOptionalValue(formData.get("url"));

    createBlockMutation.mutate(
      {
        type,
        title: String(formData.get("title") ?? ""),
        url,
        productId,
        contentItemId,
        isVisible: true,
      },
      {
        onSuccess: () => {
          form.reset();
          setBlockType("LINK");
        },
      },
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <PageHeader
          eyebrow="Public Page"
          title="Appearance"
          description="Atur profil, theme, block link, produk, konten, dan publish halaman direct link."
          badge={draft.isPublished ? "Published" : "Draft"}
        />
        <Button asChild variant="outline" className="w-fit">
          <Link href={publicUrl} target="_blank">
            <ExternalLink className="size-4" />
            Buka public page
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardDescription>Profile dan theme</CardDescription>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Palette className="size-4 text-muted-foreground" />
                Editor Halaman
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3" onSubmit={handleUpdatePage}>
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    name="displayName"
                    value={draft.displayName}
                    onChange={(event) => updatePageDraft({ displayName: event.target.value })}
                    placeholder="Display name"
                    required
                  />
                  <Input name="publicUrl" value={publicUrl} readOnly aria-label="Public URL" />
                </div>
                <textarea
                  name="bio"
                  value={draft.bio ?? ""}
                  onChange={(event) => updatePageDraft({ bio: event.target.value })}
                  placeholder="Bio singkat"
                  className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
                />

                <div className="grid gap-3 md:grid-cols-[1fr_1fr_180px]">
                  <ColorInput
                    name="backgroundColor"
                    label="Background"
                    value={draft.theme.backgroundColor}
                    onChange={(value) => updateThemeDraft({ backgroundColor: value })}
                  />
                  <ColorInput
                    name="textColor"
                    label="Text"
                    value={draft.theme.textColor}
                    onChange={(value) => updateThemeDraft({ textColor: value })}
                  />
                  <label className="grid gap-1 text-sm">
                    <span className="text-muted-foreground">Button</span>
                    <select
                      name="buttonStyle"
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                      value={draft.theme.buttonStyle}
                      onChange={(event) => updateThemeDraft({ buttonStyle: event.target.value })}
                    >
                      {buttonStyleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid gap-2">
                  <p className="text-sm text-muted-foreground">Template theme</p>
                  <div className="flex flex-wrap gap-2">
                    {themePresets.map((preset) => (
                      <Button
                        key={preset.name}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateThemeDraft({
                            backgroundColor: preset.backgroundColor,
                            textColor: preset.textColor,
                            buttonStyle: preset.buttonStyle,
                          })
                        }
                      >
                        <span
                          className="size-3 rounded-full border"
                          style={{ backgroundColor: preset.backgroundColor }}
                        />
                        {preset.name}
                      </Button>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    name="isPublished"
                    checked={draft.isPublished}
                    onCheckedChange={(checked) => updatePageDraft({ isPublished: Boolean(checked) })}
                  />
                  Publish halaman publik
                </label>

                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={updatePageMutation.isPending}>
                    <Save className="size-4" />
                    Simpan halaman
                  </Button>
                  <Badge variant="outline">{publicUrl}</Badge>
                </div>
                {updatePageMutation.error && <p className="text-sm text-destructive">{updatePageMutation.error.message}</p>}
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Tambah block</CardDescription>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Plus className="size-4 text-muted-foreground" />
                Block Baru
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3" onSubmit={handleCreateBlock}>
                <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
                  <Select
                    name="type"
                    value={blockType}
                    onValueChange={setBlockType}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {blockTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input name="title" placeholder="Judul block" required />
                </div>

                {(blockType === "LINK" || blockType === "CTA") && (
                  <Input name="url" type="url" placeholder="https://example.com" required />
                )}

                {blockType === "PRODUCT" && (
                  <select name="productId" className="h-10 rounded-md border border-input bg-background px-3 text-sm" required>
                    <option value="">Pilih produk</option>
                    {data.products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.title} ({product.type})
                      </option>
                    ))}
                  </select>
                )}

                {blockType === "CONTENT" && (
                  <select name="contentItemId" className="h-10 rounded-md border border-input bg-background px-3 text-sm" required>
                    <option value="">Pilih konten</option>
                    {data.contentItems.map((contentItem) => (
                      <option key={contentItem.id} value={contentItem.id}>
                        {contentItem.title} ({contentItem.type})
                      </option>
                    ))}
                  </select>
                )}

                <Button type="submit" className="w-fit" disabled={createBlockMutation.isPending}>
                  <Plus className="size-4" />
                  Tambah block
                </Button>
                {createBlockMutation.error && <p className="text-sm text-destructive">{createBlockMutation.error.message}</p>}
              </form>
            </CardContent>
          </Card>

          <BlockList
            blocks={publicPage.blocks}
            products={data.products}
            contentItems={data.contentItems}
            onMove={(id, direction) => moveBlockMutation.mutate({ id, direction })}
            onDelete={(id) => deleteBlockMutation.mutate({ id })}
            onUpdate={(input) => updateBlockMutation.mutate(input)}
            onVisibilityChange={(id, isVisible) => updateBlockMutation.mutate({ id, isVisible })}
            isPending={moveBlockMutation.isPending || deleteBlockMutation.isPending || updateBlockMutation.isPending}
          />
        </div>

        <MobilePreview publicPage={draftPublicPage} user={data.user} products={data.products} />
      </div>
    </div>
  );
}

function ColorInput({ name, label, value, onChange }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="grid grid-cols-[44px_minmax(0,1fr)] overflow-hidden rounded-md border border-input">
        <input
          name={name}
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-11 border-0 bg-background p-1"
        />
        <input type="text" value={value} className="h-10 min-w-0 border-0 bg-background px-3 text-sm" readOnly />
      </span>
    </label>
  );
}

function BlockList({ blocks, products, contentItems, onMove, onDelete, onUpdate, onVisibilityChange, isPending }) {
  const [editingBlockId, setEditingBlockId] = useState(null);

  function handleEditBlock(event, block) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const type = String(formData.get("type") ?? block.type);

    onUpdate({
      id: block.id,
      type,
      title: String(formData.get("title") ?? ""),
      url: normalizedOptionalValue(formData.get("url")),
      productId: normalizedOptionalValue(formData.get("productId")) ?? null,
      contentItemId: normalizedOptionalValue(formData.get("contentItemId")) ?? null,
      isVisible: block.isVisible,
    });
    setEditingBlockId(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardDescription>Urutan block</CardDescription>
        <CardTitle className="flex items-center gap-2 text-lg">
          <LinkIcon className="size-4 text-muted-foreground" />
          {blocks.length} Block
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {blocks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada block. Tambahkan link atau produk pertama.</p>
        ) : (
          blocks.map((block, index) => (
            <article key={block.id} className="grid gap-3 rounded-md border bg-muted/20 p-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              {editingBlockId === block.id ? (
                <form className="grid gap-3 lg:col-span-2" onSubmit={(event) => handleEditBlock(event, block)}>
                  <div className="grid gap-3 md:grid-cols-[160px_minmax(0,1fr)]">
                    <select name="type" className="h-10 rounded-md border border-input bg-background px-3 text-sm" defaultValue={block.type}>
                      {blockTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <Input name="title" defaultValue={block.title} placeholder="Judul block" required />
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <Input name="url" type="url" defaultValue={block.url ?? ""} placeholder="URL untuk Link/CTA" />
                    <select name="productId" className="h-10 rounded-md border border-input bg-background px-3 text-sm" defaultValue={block.productId ?? ""}>
                      <option value="">Pilih produk</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.title}
                        </option>
                      ))}
                    </select>
                    <select
                      name="contentItemId"
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                      defaultValue={block.contentItemId ?? ""}
                    >
                      <option value="">Pilih konten</option>
                      {contentItems.map((contentItem) => (
                        <option key={contentItem.id} value={contentItem.id}>
                          {contentItem.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" size="sm" disabled={isPending}>
                      <Save className="size-4" />
                      Simpan block
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setEditingBlockId(null)}>
                      <X className="size-4" />
                      Batal
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{formatBlockType(block.type)}</Badge>
                      <h3 className="truncate font-medium">{block.title}</h3>
                      {!block.isVisible && <Badge variant="outline">Hidden</Badge>}
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{getBlockTargetLabel(block)}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Checkbox
                        checked={block.isVisible}
                        onCheckedChange={(checked) => onVisibilityChange(block.id, Boolean(checked))}
                        disabled={isPending}
                      />
                      Tampil
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={isPending}
                      aria-label={`Edit ${block.title}`}
                      onClick={() => setEditingBlockId(block.id)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={isPending || index === 0}
                      aria-label={`Pindah naik ${block.title}`}
                      onClick={() => onMove(block.id, "UP")}
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={isPending || index === blocks.length - 1}
                      aria-label={`Pindah turun ${block.title}`}
                      onClick={() => onMove(block.id, "DOWN")}
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={isPending}
                      aria-label={`Hapus ${block.title}`}
                      onClick={() => onDelete(block.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </>
              )}
            </article>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function MobilePreview({ publicPage, user, products }) {
  const theme = parseTheme(publicPage.themeJson);
  const visibleBlocks = publicPage.blocks.filter((block) => block.isVisible);
  const fallbackProducts = products.filter((product) => product.status === "ACTIVE");
  const previewItems = visibleBlocks.length > 0 ? visibleBlocks : fallbackProducts.map(productToPreviewBlock);

  return (
    <aside className="xl:sticky xl:top-6">
      <Card>
        <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardDescription>Mobile preview</CardDescription>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Eye className="size-4 text-muted-foreground" />
              Public Page
            </CardTitle>
          </div>
          <Badge variant={publicPage.isPublished ? "secondary" : "outline"}>{publicPage.isPublished ? "Published" : "Draft"}</Badge>
        </CardHeader>
        <CardContent>
          <div className="mx-auto max-w-[320px] rounded-[28px] border bg-slate-950 p-3 shadow-xl">
            <div
              className="min-h-[620px] overflow-hidden rounded-[20px] px-4 py-7"
              style={{ backgroundColor: theme.backgroundColor, color: theme.textColor }}
            >
              <div className="grid justify-items-center gap-3 text-center">
                <div className="grid size-20 place-items-center overflow-hidden rounded-full border bg-white/70 text-2xl font-semibold">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={publicPage.displayName} className="h-full w-full object-cover" />
                  ) : (
                    getInitials(publicPage.displayName)
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-normal">{publicPage.displayName}</h2>
                  <p className="text-sm opacity-75">@{user.username}</p>
                </div>
                {publicPage.bio && <p className="text-sm leading-relaxed opacity-80">{publicPage.bio}</p>}
              </div>

              <div className="mt-6 grid gap-3">
                {previewItems.map((item) => (
                  <div key={item.id} className={getPreviewButtonClass(theme.buttonStyle)}>
                    <span className="truncate">{item.title}</span>
                    <Badge variant="outline" className="bg-white/50">
                      {formatBlockType(item.type)}
                    </Badge>
                  </div>
                ))}

                {previewItems.length === 0 && <p className="text-center text-sm opacity-70">Belum ada block.</p>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}

function productToPreviewBlock(product) {
  return {
    id: product.id,
    title: product.title,
    type: product.type === "COURSE" ? "Course" : "E-book",
  };
}

function getPreviewButtonClass(buttonStyle) {
  const base = "flex min-h-14 items-center justify-between gap-3 rounded-md px-4 py-3 text-sm font-medium shadow-sm";

  if (buttonStyle === "OUTLINE") {
    return `${base} border border-current bg-transparent`;
  }

  if (buttonStyle === "SOFT") {
    return `${base} bg-white/45`;
  }

  return `${base} bg-white text-slate-950`;
}

function formatBlockType(type) {
  if (type === "PRODUCT") {
    return "Produk";
  }

  if (type === "CONTENT") {
    return "Konten";
  }

  return type;
}

function getBlockTargetLabel(block) {
  if (block.type === "PRODUCT") {
    return block.product ? `${block.product.title} /${block.product.slug}` : "Produk belum dipilih";
  }

  if (block.type === "CONTENT") {
    return block.contentItem ? `${block.contentItem.title} (${block.contentItem.status})` : "Konten belum dipilih";
  }

  return block.url ?? "URL belum diisi";
}

function parseTheme(value) {
  if (!value) {
    return defaultTheme();
  }

  try {
    return {
      ...defaultTheme(),
      ...JSON.parse(value),
    };
  } catch {
    return defaultTheme();
  }
}

function createPageDraft(publicPage) {
  return {
    displayName: publicPage.displayName,
    bio: publicPage.bio ?? "",
    isPublished: publicPage.isPublished,
    theme: parseTheme(publicPage.themeJson),
  };
}

function defaultTheme() {
  return {
    backgroundColor: "#f8fafc",
    textColor: "#0f172a",
    buttonStyle: "SOLID",
  };
}

function normalizedOptionalValue(value) {
  const text = String(value ?? "").trim();
  return text || undefined;
}

function getInitials(value) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
