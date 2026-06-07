import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { SessionExpiryGuard } from "@/components/auth/session-expiry-guard";
import { getCurrentUser } from "@/server/auth/session";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/events");
  }

  return (
    <main className="min-h-screen bg-background">
      <SessionExpiryGuard />
      <div className="grid min-h-screen lg:grid-cols-[280px_minmax(0,1fr)]">
        <DashboardSidebar user={user} />
        <section className="min-w-0 p-4 md:p-6">{children}</section>
      </div>
    </main>
  );
}
