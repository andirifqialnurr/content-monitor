import { CoursePlayer } from "@/components/learn/course-player";

export default async function CourseLearningPage({ params }) {
  const resolvedParams = await params;

  return <CoursePlayer courseSlug={resolvedParams["course-slug"]} />;
}
