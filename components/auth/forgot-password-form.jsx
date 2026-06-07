"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc/react";

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);
  const [resetUrl, setResetUrl] = useState(null);
  const mutation = trpc.auth.forgotPassword.useMutation({
    onSuccess: (result) => {
      setSubmitted(true);
      setResetUrl(result.resetUrl ?? null);
    },
  });

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(false);
    setResetUrl(null);
    const formData = new FormData(event.currentTarget);

    mutation.mutate({
      email: String(formData.get("email") ?? ""),
    });
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardDescription>Auth</CardDescription>
        <CardTitle>Forgot Password</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <Input name="email" type="email" placeholder="Email" autoComplete="email" required />

          {submitted && (
            <div className="grid gap-2 rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
              <p>Jika email terdaftar, instruksi reset password akan dikirim.</p>
              {resetUrl && (
                <Link className="font-medium text-foreground underline-offset-4 hover:underline" href={resetUrl}>
                  Buka reset link development
                </Link>
              )}
            </div>
          )}
          {mutation.error && <p className="text-sm text-destructive">{mutation.error.message}</p>}

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Memproses..." : "Kirim instruksi reset"}
          </Button>
          <Button asChild variant="ghost">
            <Link href="/login">Kembali ke login</Link>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
