import { z } from "zod";

export const appearanceBlockTypeSchema = z.enum(["LINK", "PRODUCT", "CONTENT", "CTA"]);

const appearanceEntityIdSchema = z.string().trim().min(1).max(128);

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

const optionalUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .optional()
  .transform((value) => (value ? value : undefined))
  .refine((value) => {
    if (!value) {
      return true;
    }

    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol);
    } catch {
      return false;
    }
  }, "URL harus berupa URL http atau https.");

const colorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Warna harus memakai format #RRGGBB.");

export const appearanceThemeSchema = z.object({
  backgroundColor: colorSchema.default("#f8fafc"),
  textColor: colorSchema.default("#0f172a"),
  buttonStyle: z.enum(["SOLID", "OUTLINE", "SOFT"]).default("SOLID"),
});

export const updateAppearancePageInputSchema = z.object({
  displayName: z.string().trim().min(2).max(120),
  bio: nullableTextSchema,
  isPublished: z.boolean().default(false),
  theme: appearanceThemeSchema,
});

export const createAppearanceBlockInputSchema = z
  .object({
    type: appearanceBlockTypeSchema,
    title: z.string().trim().min(2).max(160),
    url: optionalUrlSchema,
    productId: appearanceEntityIdSchema.optional(),
    contentItemId: appearanceEntityIdSchema.optional(),
    isVisible: z.boolean().default(true),
  })
  .superRefine(validateBlockTarget);

export const updateAppearanceBlockInputSchema = z
  .object({
    id: appearanceEntityIdSchema,
    type: appearanceBlockTypeSchema.optional(),
    title: z.string().trim().min(2).max(160).optional(),
    url: optionalUrlSchema,
    productId: appearanceEntityIdSchema.nullable().optional(),
    contentItemId: appearanceEntityIdSchema.nullable().optional(),
    isVisible: z.boolean().optional(),
  })
  .superRefine(validateBlockTarget);

export const deleteAppearanceBlockInputSchema = z.object({
  id: appearanceEntityIdSchema,
});

export const moveAppearanceBlockInputSchema = z.object({
  id: appearanceEntityIdSchema,
  direction: z.enum(["UP", "DOWN"]),
});

type BlockTargetInput = {
  type?: z.infer<typeof appearanceBlockTypeSchema>;
  url?: string;
  productId?: string | null;
  contentItemId?: string | null;
};

function validateBlockTarget(value: BlockTargetInput, context: z.RefinementCtx) {
  const type = value.type;

  if (!type) {
    return;
  }

  if ((type === "LINK" || type === "CTA") && !value.url) {
    context.addIssue({
      code: "custom",
      path: ["url"],
      message: "URL wajib diisi untuk block link atau CTA.",
    });
  }

  if (type === "PRODUCT" && !value.productId) {
    context.addIssue({
      code: "custom",
      path: ["productId"],
      message: "Produk wajib dipilih untuk block produk.",
    });
  }

  if (type === "CONTENT" && !value.contentItemId) {
    context.addIssue({
      code: "custom",
      path: ["contentItemId"],
      message: "Konten wajib dipilih untuk block konten.",
    });
  }
}

export type UpdateAppearancePageInput = z.infer<typeof updateAppearancePageInputSchema>;
export type CreateAppearanceBlockInput = z.infer<typeof createAppearanceBlockInputSchema>;
export type UpdateAppearanceBlockInput = z.infer<typeof updateAppearanceBlockInputSchema>;
export type DeleteAppearanceBlockInput = z.infer<typeof deleteAppearanceBlockInputSchema>;
export type MoveAppearanceBlockInput = z.infer<typeof moveAppearanceBlockInputSchema>;
