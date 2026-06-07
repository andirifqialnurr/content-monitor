import type { Prisma, PrismaClient, ProductStatus, ProductType } from "@prisma/client";

type ListProductsParams = {
  userId: string;
  type?: ProductType;
  status?: ProductStatus;
  query?: string;
};

type FindProductBySlugParams = {
  userId: string;
  slug: string;
  excludeId?: string;
};

type CreateProductParams = {
  userId: string;
  type: ProductType;
  title: string;
  slug: string;
  description?: string;
  price: number;
  currency: string;
  coverUrl?: string | null;
  fileUrl?: string | null;
  status: ProductStatus;
};

type UpdateProductParams = {
  id: string;
  title?: string;
  slug?: string;
  description?: string | null;
  price?: number;
  currency?: string;
  coverUrl?: string | null;
  fileUrl?: string | null;
  status?: ProductStatus;
};

type FindPaidProductOrderParams = {
  buyerUserId: string;
  productId: string;
};

const productDetailInclude = {
  modules: {
    orderBy: { order: "asc" },
    include: {
      lessons: {
        orderBy: { order: "asc" },
        include: {
          resources: { orderBy: { order: "asc" } },
          quizzes: {
            orderBy: { order: "asc" },
            include: {
              questions: {
                orderBy: { order: "asc" },
                include: { options: { orderBy: { order: "asc" } } },
              },
            },
          },
        },
      },
      quizzes: {
        orderBy: { order: "asc" },
        include: {
          questions: {
            orderBy: { order: "asc" },
            include: { options: { orderBy: { order: "asc" } } },
          },
        },
      },
    },
  },
  quizzes: {
    orderBy: { order: "asc" },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { order: "asc" } } },
      },
    },
  },
  _count: {
    select: {
      enrollments: true,
      modules: true,
      orders: true,
    },
  },
} satisfies Prisma.ProductInclude;

export function findProductById(prisma: PrismaClient, id: string) {
  return prisma.product.findUnique({
    where: { id },
  });
}

export function findProductDetailById(prisma: PrismaClient, id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: productDetailInclude,
  });
}

export function findProductBySlug(prisma: PrismaClient, params: FindProductBySlugParams) {
  return prisma.product.findFirst({
    where: {
      userId: params.userId,
      slug: params.slug,
      id: params.excludeId ? { not: params.excludeId } : undefined,
    },
  });
}

export function listProducts(prisma: PrismaClient, params: ListProductsParams) {
  const where: Prisma.ProductWhereInput = {
    userId: params.userId,
    type: params.type,
    status: params.status,
  };

  if (params.query) {
    where.OR = [
      { title: { contains: params.query } },
      { slug: { contains: params.query } },
      { description: { contains: params.query } },
    ];
  }

  return prisma.product.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    include: {
      _count: {
        select: {
          enrollments: true,
          modules: true,
          orders: true,
        },
      },
    },
  });
}

export function createProduct(prisma: PrismaClient, params: CreateProductParams) {
  return prisma.product.create({
    data: params,
  });
}

export function updateProduct(prisma: PrismaClient, params: UpdateProductParams) {
  const { id, ...data } = params;

  return prisma.product.update({
    where: { id },
    data,
  });
}

export function deleteProduct(prisma: PrismaClient, id: string) {
  return prisma.product.delete({
    where: { id },
  });
}

export function findPaidProductOrder(prisma: PrismaClient, params: FindPaidProductOrderParams) {
  return prisma.order.findFirst({
    where: {
      buyerUserId: params.buyerUserId,
      productId: params.productId,
      status: "PAID",
    },
    select: {
      id: true,
    },
  });
}
