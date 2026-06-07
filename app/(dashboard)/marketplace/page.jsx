import { redirect } from "next/navigation";
import { ProductMarketplace } from "@/components/products/product-marketplace";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/auth/session";
import { getPublicCheckoutAvailability } from "@/server/modules/platform-settings/platform-settings.service";

export default async function MarketplacePage({ searchParams }) {
  const [user, resolvedSearchParams] = await Promise.all([
    getCurrentUser(),
    searchParams,
  ]);

  if (!user) {
    redirect("/login?callbackUrl=/marketplace");
  }

  const filters = readMarketplaceFilters(resolvedSearchParams);
  const [products, checkoutAvailability] = await Promise.all([
    getMarketplaceProducts(user.id, filters),
    getPublicCheckoutAvailability(prisma),
  ]);

  return (
    <ProductMarketplace
      checkoutAvailability={checkoutAvailability}
      filters={filters}
      products={products}
    />
  );
}

function readMarketplaceFilters(searchParams = {}) {
  const query = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const type = searchParams.type === "EBOOK" || searchParams.type === "COURSE" ? searchParams.type : "ALL";

  return { query, type };
}

function getMarketplaceProducts(userId, filters) {
  return prisma.product.findMany({
    where: {
      userId: { not: userId },
      type: filters.type === "ALL" ? undefined : filters.type,
      status: "ACTIVE",
      moderationStatus: { not: "DISABLED" },
      user: {
        status: "ACTIVE",
      },
      OR: filters.query
        ? [
            { title: { contains: filters.query } },
            { description: { contains: filters.query } },
            { slug: { contains: filters.query } },
            { user: { name: { contains: filters.query } } },
            { user: { username: { contains: filters.query } } },
          ]
        : undefined,
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: 50,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
        },
      },
      _count: {
        select: {
          modules: true,
          orders: true,
        },
      },
    },
  });
}
