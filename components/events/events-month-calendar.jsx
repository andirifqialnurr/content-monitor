"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EventsCalendarDialog } from "@/components/events/events-calendar-dialog";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/react";

const dayLabels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const typeLabels = {
  VIDEO_SHORT: "Short",
  CAROUSEL_POST: "Carousel",
  BLOG: "Blog",
  LONG_VIDEO: "Long",
};
const typeClasses = {
  VIDEO_SHORT: "border-sky-200 bg-sky-50 text-sky-900",
  CAROUSEL_POST: "border-emerald-200 bg-emerald-50 text-emerald-900",
  BLOG: "border-amber-200 bg-amber-50 text-amber-900",
  LONG_VIDEO: "border-rose-200 bg-rose-50 text-rose-900",
};

export function EventsMonthCalendar() {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [dialogDate, setDialogDate] = useState(null);
  const [dialogEvent, setDialogEvent] = useState(null);
  const contentItems = trpc.contentItems.list.useQuery({ status: "SCHEDULED" });
  const cells = useMemo(() => buildMonthCells(cursor), [cursor]);
  const eventsByDate = useMemo(() => groupEventsByDate(contentItems.data ?? []), [contentItems.data]);
  const monthLabel = cursor.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  function moveMonth(offset) {
    setCursor((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  return (
    <>
      <Card>
        <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardDescription>Calendar</CardDescription>
            <CardTitle className="capitalize">{monthLabel}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => moveMonth(-1)} aria-label="Bulan sebelumnya">
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" onClick={() => setCursor(startOfMonth(new Date()))}>
              Hari ini
            </Button>
            <Button variant="outline" size="icon" onClick={() => moveMonth(1)} aria-label="Bulan berikutnya">
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 rounded-md border bg-card">
            {dayLabels.map((day) => (
              <div key={day} className="border-b p-2 text-center text-xs font-semibold text-muted-foreground">
                {day}
              </div>
            ))}

            {cells.map((cell) => {
              const key = toDateKey(cell.date);
              const dayEvents = eventsByDate.get(key) ?? [];

              return (
                <div
                  key={key}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    "min-h-32 border-b border-r p-2 text-left transition-colors hover:bg-accent/30 last:border-r-0",
                    !cell.inCurrentMonth && "bg-muted/30 text-muted-foreground",
                    isSameDay(cell.date, new Date()) && "bg-accent/40",
                  )}
                  onClick={() => {
                    setDialogDate(cell.date);
                    setDialogEvent(null);
                  }}
                  onKeyDown={(keyEvent) => {
                    if (keyEvent.key === "Enter" || keyEvent.key === " ") {
                      keyEvent.preventDefault();
                      setDialogDate(cell.date);
                      setDialogEvent(null);
                    }
                  }}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{cell.date.getDate()}</span>
                    {dayEvents.length > 0 && <Badge variant="secondary">{dayEvents.length}</Badge>}
                  </div>

                  <div className="grid gap-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <span
                        key={event.id}
                        role="button"
                        tabIndex={0}
                        className={cn(
                          "truncate rounded-md border px-2 py-1 text-xs font-medium",
                          typeClasses[event.type] ?? "border-border bg-muted text-foreground",
                        )}
                        title={event.title}
                        onClick={(clickEvent) => {
                          clickEvent.stopPropagation();
                          setDialogDate(new Date(event.scheduledAt));
                          setDialogEvent(event);
                        }}
                        onKeyDown={(keyEvent) => {
                          if (keyEvent.key === "Enter" || keyEvent.key === " ") {
                            keyEvent.preventDefault();
                            keyEvent.stopPropagation();
                            setDialogDate(new Date(event.scheduledAt));
                            setDialogEvent(event);
                          }
                        }}
                      >
                        <span className="mr-1 text-[10px] uppercase">{typeLabels[event.type]}</span>
                        {event.title}
                      </span>
                    ))}
                    {dayEvents.length > 3 && (
                      <p className="text-xs text-muted-foreground">+{dayEvents.length - 3} event lain</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <EventsCalendarDialog
        date={dialogDate}
        eventItem={dialogEvent}
        open={Boolean(dialogDate)}
        onClose={() => {
          setDialogDate(null);
          setDialogEvent(null);
        }}
      />
    </>
  );
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function buildMonthCells(monthDate) {
  const start = startOfMonth(monthDate);
  const mondayOffset = (start.getDay() + 6) % 7;
  const firstCell = new Date(start);
  firstCell.setDate(start.getDate() - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstCell);
    date.setDate(firstCell.getDate() + index);

    return {
      date,
      inCurrentMonth: date.getMonth() === monthDate.getMonth(),
    };
  });
}

function groupEventsByDate(items) {
  const grouped = new Map();

  for (const item of items) {
    if (!item.scheduledAt) {
      continue;
    }

    const key = toDateKey(new Date(item.scheduledAt));
    const current = grouped.get(key) ?? [];
    current.push(item);
    grouped.set(key, current);
  }

  return grouped;
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isSameDay(left, right) {
  return toDateKey(left) === toDateKey(right);
}
