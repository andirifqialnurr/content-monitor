import { z } from "zod";

export const productTypeSchema = z.enum(["EBOOK", "COURSE"]);
export const productStatusSchema = z.enum(["DRAFT", "ACTIVE", "INACTIVE"]);

const productEntityIdSchema = z.string().trim().min(1).max(128);

const optionalTextSchema = z
  .string()
  .trim()
  .max(5000)
  .optional()
  .transform((value) => (value ? value : undefined));

const nullableTextSchema = z
  .string()
  .trim()
  .max(5000)
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return undefined;
    }

    return value ? value : null;
  });

const optionalSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(120)
  .optional()
  .transform((value) => (value ? value : undefined))
  .refine((value) => !value || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value), "Slug hanya boleh memakai huruf kecil, angka, dan tanda hubung.");

const urlOrPathSchema = z
  .string()
  .trim()
  .max(2048)
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return undefined;
    }

    return value ? value : null;
  })
  .refine((value) => {
    if (!value) {
      return true;
    }

    if (value.startsWith("/")) {
      return true;
    }

    if (value.startsWith("private://")) {
      return true;
    }

    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }, "URL harus berupa URL lengkap atau path internal yang diawali /.");

const priceSchema = z.coerce.number().int().min(0).max(999_999_999);
const currencySchema = z.string().trim().toUpperCase().min(3).max(3).default("IDR");

export const listProductsInputSchema = z.object({
  type: productTypeSchema.optional(),
  status: productStatusSchema.optional(),
  query: z.string().trim().max(100).optional(),
});

export const getProductInputSchema = z.object({
  id: productEntityIdSchema,
});

export const createProductInputSchema = z.object({
  type: productTypeSchema,
  title: z.string().trim().min(2).max(160),
  slug: optionalSlugSchema,
  description: optionalTextSchema,
  price: priceSchema.default(0),
  currency: currencySchema,
  coverUrl: urlOrPathSchema,
  fileUrl: urlOrPathSchema,
  status: productStatusSchema.default("DRAFT"),
});

export const updateProductInputSchema = z.object({
  id: productEntityIdSchema,
  title: z.string().trim().min(2).max(160).optional(),
  slug: optionalSlugSchema,
  description: nullableTextSchema,
  price: priceSchema.optional(),
  currency: currencySchema.optional(),
  coverUrl: urlOrPathSchema,
  fileUrl: urlOrPathSchema,
  status: productStatusSchema.optional(),
});

export const deleteProductInputSchema = z.object({
  id: productEntityIdSchema,
});

export type ListProductsInput = z.infer<typeof listProductsInputSchema>;
export type GetProductInput = z.infer<typeof getProductInputSchema>;
export type CreateProductInput = z.infer<typeof createProductInputSchema>;
export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;
export type DeleteProductInput = z.infer<typeof deleteProductInputSchema>;
