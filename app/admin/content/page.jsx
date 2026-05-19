import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function AdminContentPage() {
  return (
    <ModulePlaceholder
      eyebrow="Admin"
      title="Content Moderation"
      description="Moderasi konten publik, halaman user, dan konten yang perlu ditinjau."
      items={["Public pages", "Content reports", "Review queue", "Disable content", "Audit notes"]}
    />
  );
}
