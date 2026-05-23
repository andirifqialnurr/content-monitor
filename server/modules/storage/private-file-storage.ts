import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { TRPCError } from "@trpc/server";

const privateStorageRoot = path.resolve(process.env.PRIVATE_STORAGE_ROOT ?? path.join(process.cwd(), "storage", "private"));
const ebookMaxBytes = Number(process.env.EBOOK_FILE_MAX_BYTES ?? 25 * 1024 * 1024);
const privateFileUrlPrefix = "private://";
const pdfMagicBytes = Buffer.from("%PDF-");

type PrivateProductFileParams = {
  userId: string;
  productId: string;
};

type StoredPrivateFile = {
  privateUrl: string;
  storageKey: string;
  fileName: string;
  mimeType: string;
  size: number;
};

type PrivateFileMeta = {
  fileName: string;
  mimeType: string;
  size: number;
};

export type ReadPrivateFileResult = PrivateFileMeta & {
  content: ArrayBuffer;
};

export function isPrivateFileUrl(value?: string | null) {
  return Boolean(value?.startsWith(privateFileUrlPrefix));
}

export function getPrivateProductStoragePrefix(params: PrivateProductFileParams) {
  return `products/${params.userId}/${params.productId}/`;
}

export async function replacePrivateEbookFile(file: File, params: PrivateProductFileParams): Promise<StoredPrivateFile> {
  const originalName = sanitizeFileName(file.name || "ebook.pdf");
  const extension = path.extname(originalName).toLowerCase();

  if (extension !== ".pdf") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Upload e-book MVP hanya menerima file PDF.",
    });
  }

  if (file.size <= 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "File e-book kosong.",
    });
  }

  if (file.size > ebookMaxBytes) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Ukuran file e-book maksimal ${formatBytes(ebookMaxBytes)}.`,
    });
  }

  if (file.type && file.type !== "application/pdf") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "MIME type file e-book harus application/pdf.",
    });
  }

  const content = Buffer.from(await file.arrayBuffer());

  if (!content.subarray(0, pdfMagicBytes.length).equals(pdfMagicBytes)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "File yang diupload bukan PDF yang valid.",
    });
  }

  const productDirKey = getPrivateProductStoragePrefix(params).replace(/\/$/, "");
  const productDir = resolveStorageKey(productDirKey);
  await rm(productDir, { recursive: true, force: true });
  await mkdir(productDir, { recursive: true });

  const fileName = `${Date.now()}-${originalName}`;
  const storageKey = `${getPrivateProductStoragePrefix(params)}${fileName}`;
  const filePath = resolveStorageKey(storageKey);
  const metaPath = `${filePath}.json`;
  const meta: PrivateFileMeta = {
    fileName: originalName,
    mimeType: "application/pdf",
    size: content.byteLength,
  };

  await writeFile(filePath, content);
  await writeFile(metaPath, JSON.stringify(meta, null, 2), "utf8");

  return {
    privateUrl: `${privateFileUrlPrefix}${storageKey}`,
    storageKey,
    ...meta,
  };
}

export async function readPrivateFile(privateUrl: string, params: PrivateProductFileParams): Promise<ReadPrivateFileResult> {
  const storageKey = parsePrivateFileUrl(privateUrl);
  const expectedPrefix = getPrivateProductStoragePrefix(params);

  if (!storageKey?.startsWith(expectedPrefix)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "File produk tidak valid untuk user ini.",
    });
  }

  const filePath = resolveStorageKey(storageKey);
  const metaPath = `${filePath}.json`;

  try {
    const [content, metaContent] = await Promise.all([readFile(filePath), readFile(metaPath, "utf8")]);
    const meta = JSON.parse(metaContent) as PrivateFileMeta;
    const arrayBuffer = new ArrayBuffer(content.byteLength);
    new Uint8Array(arrayBuffer).set(content);

    return {
      content: arrayBuffer,
      fileName: sanitizeFileName(meta.fileName),
      mimeType: meta.mimeType || "application/octet-stream",
      size: meta.size || content.byteLength,
    };
  } catch {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "File produk tidak ditemukan.",
    });
  }
}

function parsePrivateFileUrl(value: string) {
  if (!value.startsWith(privateFileUrlPrefix)) {
    return null;
  }

  return value.slice(privateFileUrlPrefix.length);
}

function resolveStorageKey(storageKey: string) {
  const normalizedKey = storageKey.replace(/\\/g, "/");

  if (normalizedKey.startsWith("/") || normalizedKey.split("/").includes("..")) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Path file tidak valid.",
    });
  }

  const resolvedPath = path.resolve(privateStorageRoot, ...normalizedKey.split("/").filter(Boolean));
  const rootWithSeparator = `${privateStorageRoot}${path.sep}`;

  if (resolvedPath !== privateStorageRoot && !resolvedPath.startsWith(rootWithSeparator)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Path file keluar dari private storage.",
    });
  }

  return resolvedPath;
}

function sanitizeFileName(value: string) {
  const fallback = "ebook.pdf";
  const sanitized = value
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return sanitized || fallback;
}

function formatBytes(value: number) {
  const megabytes = value / (1024 * 1024);
  return `${Math.floor(megabytes)} MB`;
}
