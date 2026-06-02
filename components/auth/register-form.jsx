"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc/react";

export function RegisterForm() {
  const router = useRouter();
  const registerMutation = trpc.auth.register.useMutation();
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      await registerMutation.mutateAsync({
        name: String(formData.get("name") ?? ""),
        username: String(formData.get("username") ?? ""),
        email,
        password,
      });

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/events",
      });

      router.push(result?.url ?? "/events");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Registrasi gagal.");
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardDescription>Auth</CardDescription>
        <CardTitle>Register</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <Input name="name" placeholder="Nama" autoComplete="name" required />
          <Input name="username" placeholder="username-publik" autoComplete="username" required />
          <Input name="email" type="email" placeholder="Email" autoComplete="email" required />
          <Input name="password" type="password" placeholder="Password" autoComplete="new-password" required />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={registerMutation.isPending}>
            {registerMutation.isPending ? "Memproses..." : "Register"}
          </Button>
          <Link className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="/login">
            Sudah punya account? Login
          </Link>
        </form>
      </CardContent>
    </Card>
  );
}
