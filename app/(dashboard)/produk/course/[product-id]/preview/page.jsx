import { CourseCreatorPreview } from "@/components/courses/course-creator-preview";

export default async function CoursePreviewPage({ params }) {
  const resolvedParams = await params;

  return <CourseCreatorPreview productId={resolvedParams["product-id"]} />;
}
