import { notFound, redirect } from "next/navigation";
import { PublicProductSales } from "@/components/products/public-product-sales";
import { prisma } from "@/lib/prisma";

export default async function PublicProductPage({ params }) {
  const resolvedParams = await params;
  const product = await prisma.product.findFirst({
    where: {
      slug: resolvedParams["product-slug"],
      status: "ACTIVE",
      moderationStatus: { not: "DISABLED" },
      user: {
        username: resolvedParams.username,
      },
    },
    include: publicProductInclude,
  });

  if (!product) {
    notFound();
  }

  if (product.type === "COURSE") {
    redirect(`/${product.user.username}/course/${product.slug}`);
  }

  return <PublicProductSales product={product} />;
}

const publicProductInclude = {
  user: {
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
    },
  },
  modules: {
    orderBy: { order: "asc" },
    include: {
      lessons: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          type: true,
          duration: true,
          isPreview: true,
          order: true,
        },
      },
    },
  },
};
