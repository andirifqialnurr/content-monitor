"use client";

import {
  BarChart3,
  Box,
  CreditCard,
  FileWarning,
  Gauge,
  MonitorCog,
  ReceiptText,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { Separator } from "@/components/ui/separator";
import { SidebarNav } from "@/components/layout/sidebar-nav";

const adminSections = [
  {
    label: "Admin",
    items: [
      { href: "/admin", label: "Overview", icon: Gauge },
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/content", label: "Content", icon: FileWarning },
      { href: "/admin/products", label: "Products", icon: Box },
      { href: "/admin/orders", label: "Orders", icon: ReceiptText },
      { href: "/admin/payments", label: "Payments", icon: CreditCard },
      { href: "/admin/settings", label: "Settings", icon: Settings },
      { href: "/admin/statistics", label: "Statistics", icon: BarChart3 },
    ],
  },
];

export function AdminSidebar() {
  return (
    <aside className="border-r bg-card p-5">
      <div className="flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-md bg-destructive text-destructive-foreground">
          <ShieldCheck className="size-5" />
        </div>
        <div>
          <p className="text-lg font-semibold tracking-normal">Admin Area</p>
          <p className="text-sm text-muted-foreground">Platform operations</p>
        </div>
      </div>

      <Separator className="my-5" />
      <SidebarNav sections={adminSections} tone="admin" />

      <Separator className="my-5" />
      <SidebarNav
        sections={[
          {
            label: "Kembali",
            items: [
              { href: "/events", label: "User Dashboard", icon: MonitorCog },
            ],
          },
        ]}
      />

      <Separator className="my-5" />
      <LogoutButton className="w-full justify-start" />
    </aside>
  );
}
