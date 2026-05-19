import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function StatisticsPage() {
  return (
    <ModulePlaceholder
      eyebrow="Analytics"
      title="Statistics"
      description="Statistik klik, pembelian, revenue, enrollment, progress belajar, dan skor quiz."
      items={["Page views", "Product clicks", "Purchases", "Revenue", "Enrollment", "Lesson completion", "Quiz scores"]}
    />
  );
}
