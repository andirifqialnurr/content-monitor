import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function PublicCoursePage() {
  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <ModulePlaceholder
        eyebrow="Public Course"
        title="Course Sales Page"
        description="Placeholder halaman sales/detail course publik sebelum checkout."
        items={["Course description", "Modules", "Preview lessons", "Price", "Checkout CTA", "Creator profile"]}
      />
    </main>
  );
}
