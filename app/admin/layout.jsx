import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { getCurrentUser } from "@/server/auth/session";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/admin/users");
  }

  if (user.role !== "ADMIN") {
    redirect("/events");
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[280px_minmax(0,1fr)]">
        <AdminSidebar />
        <section className="min-w-0 p-4 md:p-6">{children}</section>
      </div>
    </main>
  );
}
