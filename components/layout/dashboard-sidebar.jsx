"use client";

import {
  BarChart3,
  BookOpen,
  CalendarDays,
  Clapperboard,
  CreditCard,
  FileText,
  GraduationCap,
  Layers3,
  MonitorCheck,
  Newspaper,
  Palette,
  ShoppingBag,
  Settings,
  UserCircle,
  Video,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { Separator } from "@/components/ui/separator";
import { SidebarNav } from "@/components/layout/sidebar-nav";

const dashboardSections = [
  {
    label: "Workspace",
    items: [
      { href: "/events", label: "Events", icon: CalendarDays },
    ],
  },
  {
    label: "Bank Konten",
    items: [
      { href: "/bank-konten/video-short", label: "Video Short", icon: Video },
      { href: "/bank-konten/carousel-post", label: "Carousel Post", icon: Layers3 },
      { href: "/bank-konten/blog", label: "Blog", icon: Newspaper },
      { href: "/bank-konten/long-video", label: "Long Video", icon: Clapperboard },
    ],
  },
  {
    label: "Produk",
    items: [
      { href: "/produk/e-book", label: "E-book", icon: FileText },
      { href: "/produk/course", label: "Course", icon: GraduationCap },
    ],
  },
  {
    label: "Platform",
    items: [
      { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
      { href: "/appearance", label: "Appearance", icon: Palette },
      { href: "/statistics", label: "Statistics", icon: BarChart3 },
      { href: "/payment", label: "Payment", icon: CreditCard },
      { href: "/account", label: "Account", icon: UserCircle },
    ],
  },
];

export function DashboardSidebar({ user }) {
  const accessItems = [
    { href: "/learn", label: "Learner Area", icon: BookOpen },
    ...(user?.role === "ADMIN" ? [{ href: "/admin/users", label: "Admin", icon: Settings }] : []),
  ];

  return (
    <aside className="border-r bg-card p-5">
      <div className="flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-md bg-primary text-primary-foreground">
          <MonitorCheck className="size-5" />
        </div>
        <div>
          <p className="text-lg font-semibold tracking-normal">Content Monitor</p>
          <p className="text-sm text-muted-foreground">Creator workspace</p>
        </div>
      </div>

      <Separator className="my-5" />
      <SidebarNav sections={dashboardSections} />

      <Separator className="my-5" />
      <SidebarNav
        sections={[
          {
            label: "Akses",
            items: accessItems,
          },
        ]}
      />

      <Separator className="my-5" />
      <LogoutButton className="w-full justify-start" />
    </aside>
  );
}
