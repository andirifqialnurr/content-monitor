import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function AdminStatisticsPage() {
  return (
    <ModulePlaceholder
      eyebrow="Admin"
      title="Platform Statistics"
      description="Statistik global untuk user, creator aktif, produk, order, revenue, dan performa platform."
      items={["Total users", "Active creators", "Active products", "Orders", "Revenue", "Course completion"]}
    />
  );
}
