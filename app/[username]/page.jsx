import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function PublicProfilePage() {
  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <ModulePlaceholder
        eyebrow="Public Page"
        title="Creator Public Page"
        description="Placeholder halaman publik user seperti direct link. Data final akan diambil dari PublicPage."
        items={["Profile", "Social links", "Product blocks", "Course blocks", "Theme", "Click tracking"]}
      />
    </main>
  );
}
