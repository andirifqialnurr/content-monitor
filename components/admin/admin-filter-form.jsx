import Link from "next/link";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AdminFilterForm({ action, query = "", filters = [], resetHref }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <form action={action} className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" defaultValue={query} className="pl-9" placeholder="Cari..." />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:flex xl:justify-end">
            {filters.map((filter) => (
              <select
                key={filter.name}
                name={filter.name}
                className="h-10 min-w-[150px] rounded-md border border-input bg-background px-3 text-sm"
                defaultValue={filter.value ?? "ALL"}
              >
                <option value="ALL">{filter.allLabel ?? `Semua ${filter.label}`}</option>
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ))}

            <Button type="submit">
              <Search className="size-4" />
              Filter
            </Button>
            <Button asChild variant="outline">
              <Link href={resetHref}>
                <X className="size-4" />
                Reset
              </Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
