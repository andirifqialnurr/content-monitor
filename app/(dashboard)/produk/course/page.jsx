import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function CoursePage() {
  return (
    <ModulePlaceholder
      eyebrow="Produk"
      title="Course"
      description="Course builder untuk module, lesson bacaan/video, quiz, tools, dokumentasi resmi, dan resource pendukung."
      items={["Module dan lesson", "Lesson bacaan", "Lesson video", "Quiz", "Tools", "Dokumentasi resmi", "Enrollment"]}
    />
  );
}
