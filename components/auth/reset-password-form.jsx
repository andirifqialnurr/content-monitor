"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc/react";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const mutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      setDone(true);
      setError("");
    },
    onError: (caughtError) => {
      setError(caughtError.message);
    },
  });

  function handleSubmit(event) {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak sama.");
      return;
    }

    mutation.mutate({
      token,
      password,
    });
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardDescription>Auth</CardDescription>
        <CardTitle>Reset Password</CardTitle>
      </CardHeader>
      <CardContent>
        {!token ? (
          <div className="grid gap-4">
            <p className="text-sm text-muted-foreground">Token reset tidak ditemukan.</p>
            <Button asChild>
              <Link href="/forgot-password">Minta reset link baru</Link>
            </Button>
          </div>
        ) : done ? (
          <div className="grid gap-4">
            <p className="text-sm text-muted-foreground">Password sudah diperbarui. Silakan login dengan password baru.</p>
            <Button asChild>
              <Link href="/login">Login</Link>
            </Button>
          </div>
        ) : (
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <Input name="password" type="password" placeholder="Password baru" autoComplete="new-password" required />
            <Input
              name="confirmPassword"
              type="password"
              placeholder="Konfirmasi password"
              autoComplete="new-password"
              required
            />

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Menyimpan..." : "Simpan password baru"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
