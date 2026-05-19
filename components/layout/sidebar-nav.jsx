"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const sidebarLinkVariants = cva(
  "flex min-h-10 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
  {
    variants: {
      tone: {
        default: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        admin: "text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
      },
      active: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      {
        tone: "default",
        active: true,
        className: "bg-accent text-accent-foreground",
      },
      {
        tone: "admin",
        active: true,
        className: "bg-destructive/10 text-destructive",
      },
    ],
    defaultVariants: {
      tone: "default",
      active: false,
    },
  },
);

export function SidebarNav({ sections, tone = "default" }) {
  const pathname = usePathname();

  return (
    <nav className="grid gap-5">
      {sections.map((section) => (
        <div key={section.label} className="grid gap-1">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {section.label}
          </p>
          <div className="grid gap-1">
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(sidebarLinkVariants({ tone, active }))}
                >
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export { sidebarLinkVariants };
