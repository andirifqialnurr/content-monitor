import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <ModulePlaceholder
        eyebrow="Auth"
        title="Forgot Password"
        description="Placeholder flow reset password via email."
        items={["Email input", "Reset token", "Expiry", "Rate limiting"]}
      />
    </main>
  );
}
