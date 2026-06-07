"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, KeyRound, LogOut, Save, ShieldCheck, UserCircle } from "lucide-react";
import { useRef, useState } from "react";
import { LogoutButton } from "@/components/auth/logout-button";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc/react";

export function AccountSettings() {
  const router = useRouter();
  const passwordFormRef = useRef(null);
  const utils = trpc.useUtils();
  const profile = trpc.account.getProfile.useQuery();
  const [profileSaved, setProfileSaved] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);

  const updateProfile = trpc.account.updateProfile.useMutation({
    onSuccess: async () => {
      setProfileSaved(true);
      await utils.account.getProfile.invalidate();
      router.refresh();
    },
  });
  const changePassword = trpc.account.changePassword.useMutation({
    onSuccess: () => {
      setPasswordChanged(true);
      passwordFormRef.current?.reset();
    },
  });

  if (profile.isLoading) {
    return <p className="text-sm text-muted-foreground">Memuat account...</p>;
  }

  if (profile.error) {
    return <p className="text-sm text-destructive">{profile.error.message}</p>;
  }

  const user = profile.data;

  function handleProfileSubmit(event) {
    event.preventDefault();
    setProfileSaved(false);
    const formData = new FormData(event.currentTarget);

    updateProfile.mutate({
      name: String(formData.get("name") ?? ""),
      username: String(formData.get("username") ?? ""),
      bio: String(formData.get("bio") ?? ""),
      avatarUrl: String(formData.get("avatarUrl") ?? ""),
      timezone: String(formData.get("timezone") ?? ""),
    });
  }

  function handlePasswordSubmit(event) {
    event.preventDefault();
    setPasswordChanged(false);
    const formData = new FormData(event.currentTarget);

    changePassword.mutate({
      currentPassword: String(formData.get("currentPassword") ?? ""),
      newPassword: String(formData.get("newPassword") ?? ""),
    });
  }

  return (
    <div className="grid gap-4">
      <PageHeader
        eyebrow="Profile"
        title="Account"
        description="Kelola identitas publik, keamanan credentials, dan preferensi workspace."
        badge={user.role}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserCircle className="size-5" />
              Profile Publik
            </CardTitle>
            <CardDescription>Data ini dipakai untuk dashboard, halaman publik, dan preview appearance.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3" onSubmit={handleProfileSubmit}>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Nama">
                  <Input name="name" defaultValue={user.name ?? ""} required />
                </Field>
                <Field label="Username publik">
                  <Input name="username" defaultValue={user.username} required />
                </Field>
              </div>
              <Field label="Bio">
                <textarea
                  name="bio"
                  defaultValue={user.bio ?? ""}
                  className="min-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  maxLength={280}
                />
              </Field>
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                <Field label="Avatar URL">
                  <Input name="avatarUrl" defaultValue={user.avatarUrl ?? ""} />
                </Field>
                <Field label="Timezone">
                  <Input name="timezone" defaultValue={user.timezone} required />
                </Field>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="submit" disabled={updateProfile.isPending}>
                  <Save className="size-4" />
                  {updateProfile.isPending ? "Menyimpan..." : "Simpan profile"}
                </Button>
                {profileSaved && <span className="text-sm text-muted-foreground">Profile tersimpan.</span>}
                {updateProfile.error && <span className="text-sm text-destructive">{updateProfile.error.message}</span>}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Preview Identity</CardTitle>
            <CardDescription>Ringkasan identitas yang terlihat publik.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center gap-3">
              <div className="grid size-16 place-items-center overflow-hidden rounded-full bg-muted">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name ?? user.username} className="h-full w-full object-cover" />
                ) : (
                  <UserCircle className="size-8 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold">{user.name ?? user.username}</p>
                <p className="truncate text-sm text-muted-foreground">@{user.username}</p>
              </div>
            </div>
            {user.bio && <p className="text-sm text-muted-foreground">{user.bio}</p>}
            <div className="grid gap-2 rounded-md border bg-muted/30 p-3 text-sm">
              <span className="font-medium">/{user.username}</span>
              <span className="text-muted-foreground">{user.email}</span>
              <span className="text-muted-foreground">{user.timezone}</span>
            </div>
            <Button asChild variant="outline">
              <Link href={`/${user.username}`} target="_blank">
                <Eye className="size-4" />
                Buka halaman publik
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="size-5" />
              Security
            </CardTitle>
            <CardDescription>Email menjadi identitas login. Ganti password memakai password saat ini.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid gap-2 rounded-md border bg-muted/30 p-3 text-sm">
              <span className="text-muted-foreground">Email login</span>
              <span className="font-medium">{user.email}</span>
            </div>
            <form ref={passwordFormRef} className="grid gap-3" onSubmit={handlePasswordSubmit}>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Password saat ini">
                  <Input name="currentPassword" type="password" autoComplete="current-password" required />
                </Field>
                <Field label="Password baru">
                  <Input name="newPassword" type="password" autoComplete="new-password" required />
                </Field>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="submit" disabled={changePassword.isPending}>
                  <KeyRound className="size-4" />
                  {changePassword.isPending ? "Menyimpan..." : "Ganti password"}
                </Button>
                {passwordChanged && <span className="text-sm text-muted-foreground">Password diperbarui.</span>}
                {changePassword.error && <span className="text-sm text-destructive">{changePassword.error.message}</span>}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <LogOut className="size-5" />
              Session
            </CardTitle>
            <CardDescription>Keluar dari perangkat ini.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant={user.status === "ACTIVE" ? "secondary" : "outline"}>{user.status}</Badge>
              <Badge variant="outline">{user.role}</Badge>
            </div>
            <LogoutButton />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      <span>{label}</span>
      {children}
    </label>
  );
}
