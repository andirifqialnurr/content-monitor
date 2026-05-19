import { Badge } from "@/components/ui/badge";

export function PageHeader({ eyebrow, title, description, badge }) {
  return (
    <header className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 text-3xl font-semibold tracking-normal">{title}</h1>
        {description && (
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {badge && (
        <Badge variant="secondary" className="w-fit">
          {badge}
        </Badge>
      )}
    </header>
  );
}
