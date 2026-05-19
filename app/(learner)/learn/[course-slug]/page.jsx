import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function CourseLearningPage() {
  return (
    <ModulePlaceholder
      eyebrow="Learner"
      title="Course Player"
      description="Area belajar untuk lesson bacaan/video, resource, progress, dan quiz attempt."
      items={["Module sidebar", "Reading viewer", "Video viewer", "Resource/tools", "Lesson progress", "Quiz attempt", "Completion state"]}
    />
  );
}
