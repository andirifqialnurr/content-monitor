"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function LogoutButton({ className, variant = "outline" }) {
  return (
    <Button className={className} variant={variant} onClick={() => signOut({ callbackUrl: "/login" })}>
      <LogOut className="size-4" />
      Logout
    </Button>
  );
}
