import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <ModulePlaceholder
        eyebrow="Auth"
        title="Reset Password"
        description="Placeholder form password baru setelah token reset divalidasi."
        items={["Token validation", "New password", "Confirm password", "Session invalidation"]}
      />
    </main>
  );
}
