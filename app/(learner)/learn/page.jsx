import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function LearnPage() {
  return (
    <ModulePlaceholder
      eyebrow="Learner"
      title="My Courses"
      description="Daftar course yang sudah dibeli user. Akses final nanti dikontrol oleh enrollment."
      items={["Purchased courses", "Enrollment status", "Progress", "Continue learning", "Completed courses"]}
    />
  );
}
