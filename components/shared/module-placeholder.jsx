import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";

export function ModulePlaceholder({ eyebrow, title, description, items = [] }) {
  return (
    <div>
      <PageHeader eyebrow={eyebrow} title={title} description={description} badge="MVP placeholder" />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ruang Lingkup Awal</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
            {items.map((item) => (
              <li key={item} className="rounded-md border bg-muted/30 p-3">
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
