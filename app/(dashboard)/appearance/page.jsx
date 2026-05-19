import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function AppearancePage() {
  return (
    <ModulePlaceholder
      eyebrow="Public Page"
      title="Appearance"
      description="Builder mobile-first untuk halaman publik, link produk, course, theme, dan direct link user."
      items={["Mobile preview", "Profile section", "Link block", "Product block", "Course block", "Theme", "Publish/unpublish"]}
    />
  );
}
