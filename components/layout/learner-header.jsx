import Link from "next/link";
import { BookOpenCheck, CalendarDays, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LearnerHeader() {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/learn" className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-md bg-primary text-primary-foreground">
            <BookOpenCheck className="size-5" />
          </div>
          <div>
            <p className="font-semibold">Learner Area</p>
            <p className="text-xs text-muted-foreground">Course yang sudah dibeli</p>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/events">
              <CalendarDays className="size-4" />
              Dashboard
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon">
            <Link href="/account" aria-label="Account">
              <UserCircle className="size-4" />
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
