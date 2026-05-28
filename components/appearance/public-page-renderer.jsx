import { PublicAnalyticsTracker } from "@/components/analytics/public-analytics-tracker";
import { PublicPageBlockLink } from "@/components/appearance/public-page-block-link";
import { PublicProductLink } from "@/components/appearance/public-product-link";

export function PublicPageRenderer({ publicPage, user, fallbackProducts = [] }) {
  const theme = parseTheme(publicPage?.themeJson);
  const blocks = publicPage?.blocks ?? [];
  const visibleBlocks = blocks.filter((block) => block.isVisible);
  const products = fallbackProducts.filter((product) => product.status === "ACTIVE");

  return (
    <main className="min-h-screen px-4 py-8" style={{ backgroundColor: theme.backgroundColor, color: theme.textColor }}>
      {publicPage && (
        <PublicAnalyticsTracker publicPageId={publicPage.id} metadata={{ username: publicPage.username }} />
      )}

      <section className="mx-auto grid w-full max-w-md gap-5">
        <header className="grid justify-items-center gap-3 text-center">
          <div className="grid size-20 place-items-center overflow-hidden rounded-full border bg-muted text-2xl font-semibold">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={publicPage?.displayName ?? user.name ?? user.username} className="h-full w-full object-cover" />
            ) : (
              getInitials(publicPage?.displayName ?? user.name ?? user.username)
            )}
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">{publicPage?.displayName ?? user.name ?? user.username}</h1>
            <p className="mt-1 text-sm text-muted-foreground">@{user.username}</p>
          </div>
          {(publicPage?.bio || user.bio) && (
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{publicPage?.bio ?? user.bio}</p>
          )}
        </header>

        <div className="grid gap-3">
          {visibleBlocks.map((block) => (
            <PublicPageBlockLink key={block.id} block={block} href={getBlockHref(block, user.username)} buttonStyle={theme.buttonStyle}>
              {block.title}
            </PublicPageBlockLink>
          ))}

          {visibleBlocks.length === 0 &&
            products.map((product) => (
              <PublicProductLink key={product.id} product={product} username={user.username} buttonStyle={theme.buttonStyle} />
            ))}
        </div>

        {visibleBlocks.length === 0 && products.length === 0 && (
          <p className="rounded-md border bg-muted/20 p-4 text-center text-sm text-muted-foreground">
            Belum ada link atau produk aktif.
          </p>
        )}
      </section>
    </main>
  );
}

function getBlockHref(block, username) {
  if (block.type === "PRODUCT" && block.product) {
    return getProductHref(block.product, username);
  }

  if (block.type === "CONTENT" && block.contentItem?.slug) {
    return `/${username}/content/${block.contentItem.slug}`;
  }

  return block.url || "#";
}

function getProductHref(product, username) {
  return product.type === "COURSE"
    ? `/${username}/course/${product.slug}`
    : `/${username}/product/${product.slug}`;
}

function getInitials(value) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
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

function defaultTheme() {
  return {
    backgroundColor: "#f8fafc",
    textColor: "#0f172a",
    buttonStyle: "SOLID",
  };
}
