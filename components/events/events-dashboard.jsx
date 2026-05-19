"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";
import { EventsContentList } from "@/components/events/events-content-list";
import { EventsSchedulerCalendar } from "@/components/events/events-scheduler-calendar";
import { cn } from "@/lib/utils";

export function EventsDashboard({ data }) {
  const { formats, timeline } = data;
  const [done, setDone] = useState({});

  useEffect(() => {
    const stored = window.localStorage.getItem("content-monitor-status");

    if (stored) {
      setDone(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("content-monitor-status", JSON.stringify(done));
  }, [done]);

  const statusLabels = useMemo(
    () => Object.fromEntries(formats.map((format) => [format.key, format.label])),
    [formats],
  );
  const completedCount = Object.values(done).filter(Boolean).length;
  const totalTimelineItems = timeline.length * formats.length;
  const progress = totalTimelineItems > 0 ? Math.round((completedCount / totalTimelineItems) * 100) : 0;

  function toggleStatus(week, key) {
    const id = `week-${week}-${key}`;
    setDone((current) => ({ ...current, [id]: !current[id] }));
  }

  return (
    <div className="grid gap-4">
      <PageHeader
        title="Events"
        description="Jadwal publikasi konten. Fase berikutnya akan mengubah tampilan ini menjadi calendar month, week, year, dan list."
        badge={`${progress}% progress`}
      />

      <EventsSchedulerCalendar />

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardDescription>12 pekan</CardDescription>
            <CardTitle>Timeline Produksi Lama</CardTitle>
          </div>
          <div className="min-w-48">
            <Progress value={progress} />
          </div>
        </CardHeader>
        <CardContent className="grid gap-3">
          {timeline.map((week) => (
            <article
              key={week.week}
              className="grid gap-3 rounded-md border bg-muted/20 p-3 xl:grid-cols-[240px_minmax(0,1fr)]"
            >
              <div className="flex gap-3">
                <Badge className="h-9 rounded-md px-3">W{week.week}</Badge>
                <div>
                  <h2 className="font-semibold">{week.theme}</h2>
                  <p className="text-sm text-muted-foreground">{week.topicId}</p>
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                {formats.map((format) => (
                  <Deliverable
                    key={format.key}
                    week={week.week}
                    type={format.key}
                    label={statusLabels[format.key] ?? format.label}
                    value={week[format.key]}
                    done={done}
                    onToggle={toggleStatus}
                  />
                ))}
              </div>
            </article>
          ))}
        </CardContent>
      </Card>

      <EventsContentList />
    </div>
  );
}

function Deliverable({ week, type, label, value, done, onToggle }) {
  const id = `week-${week}-${type}`;
  const checked = Boolean(done[id]);

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "grid min-h-28 cursor-pointer gap-2 rounded-md border bg-card p-3 transition-colors",
        checked && "border-primary bg-accent",
      )}
      onClick={() => onToggle(week, type)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onToggle(week, type);
        }
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
        <Checkbox checked={checked} aria-label={`${label} minggu ${week}`} />
      </div>
      <strong className="text-sm leading-relaxed">{value}</strong>
    </div>
  );
}
