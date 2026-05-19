import { ContentItemManager } from "@/components/content-bank/content-item-manager";

export default function BlogPage() {
  return (
    <ContentItemManager
      type="BLOG"
      eyebrow="Bank Konten"
      title="Blog"
      description="Ruang kerja untuk draft artikel, SEO, keyword, slug, dan status publikasi."
      bodyLabel="Draft ringkas, keyword, SEO note, atau outline artikel"
    />
  );
}
