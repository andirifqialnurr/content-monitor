import { LearnerHeader } from "@/components/layout/learner-header";
import { SessionExpiryGuard } from "@/components/auth/session-expiry-guard";
import { getCurrentUser } from "@/server/auth/session";
import { redirect } from "next/navigation";

export default async function LearnerLayout({ children }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/learn");
  }

  return (
    <main className="min-h-screen bg-background">
      <SessionExpiryGuard />
      <LearnerHeader />
      <section className="mx-auto max-w-6xl px-4 py-6">{children}</section>
    </main>
  );
}
