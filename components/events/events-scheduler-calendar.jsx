"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import idLocale from "@fullcalendar/core/locales/id";
import multiMonthPlugin from "@fullcalendar/multimonth";
import timeGridPlugin from "@fullcalendar/timegrid";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventsCalendarDialog } from "@/components/events/events-calendar-dialog";
import { trpc } from "@/lib/trpc/react";

const calendarViews = [
  { value: "dayGridMonth", label: "Month" },
  { value: "timeGridWeek", label: "Week" },
  { value: "timeGridThreeDay", label: "3 Days" },
  { value: "timeGridDay", label: "Day" },
  { value: "multiMonthYear", label: "Year" },
  { value: "listYear", label: "Schedule" },
];

const contentTypes = [
  { value: "ALL", label: "Semua format" },
  { value: "VIDEO_SHORT", label: "Video Short" },
  { value: "CAROUSEL_POST", label: "Carousel Post" },
  { value: "BLOG", label: "Blog" },
  { value: "LONG_VIDEO", label: "Long Video" },
];

const statusOptions = [
  { value: "ALL", label: "Semua status" },
  { value: "DRAFT", label: "Draft" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

const typeClasses = {
  VIDEO_SHORT: "event-type-video-short",
  CAROUSEL_POST: "event-type-carousel-post",
  BLOG: "event-type-blog",
  LONG_VIDEO: "event-type-long-video",
};

const defaultCalendarView = "dayGridMonth";
const mobileCalendarView = "listYear";
const mobileCalendarQuery = "(max-width: 767px)";
const defaultTimezone = "Asia/Jakarta";

export function EventsSchedulerCalendar() {
  const calendarRef = useRef(null);
  const [title, setTitle] = useState("");
  const [view, setView] = useState(defaultCalendarView);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [visibleRange, setVisibleRange] = useState(null);
  const [selectedRange, setSelectedRange] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const listInput = useMemo(
    () => ({
      type: typeFilter === "ALL" ? undefined : typeFilter,
      status: statusFilter === "ALL" ? undefined : statusFilter,
      from: visibleRange?.start,
      to: visibleRange?.end,
    }),
    [statusFilter, typeFilter, visibleRange],
  );
  const contentItems = trpc.contentItems.list.useQuery(listInput);
  const updateMutation = trpc.contentItems.update.useMutation({
    onSuccess: () => contentItems.refetch(),
  });
  const events = useMemo(() => mapCalendarEvents(contentItems.data ?? []), [contentItems.data]);

  useEffect(() => {
    if (!window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia(mobileCalendarQuery);

    if (!mediaQuery.matches) {
      return;
    }

    setView(mobileCalendarView);
    calendarRef.current?.getApi()?.changeView(mobileCalendarView);
  }, []);

  function getCalendarApi() {
    return calendarRef.current?.getApi();
  }

  function moveCalendar(direction) {
    const api = getCalendarApi();

    if (direction === "prev") {
      api?.prev();
      return;
    }

    if (direction === "next") {
      api?.next();
      return;
    }

    api?.today();
  }

  function changeView(nextView) {
    setView(nextView);
    getCalendarApi()?.changeView(nextView);
  }

  function openCreateDialog(range) {
    setSelectedEvent(null);
    setSelectedRange(range);
  }

  function handleDateClick(info) {
    openCreateDialog({
      start: info.date,
      end: info.allDay ? addDays(info.date, 1) : addHours(info.date, 1),
      allDay: info.allDay,
    });
  }

  function handleEventChange(info) {
    const payload = toSchedulePayload(info.event);

    if (!payload) {
      info.revert();
      return;
    }

    updateMutation.mutate(
      {
        id: info.event.id,
        ...payload,
      },
      {
        onError: () => info.revert(),
      },
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <CardDescription>Calendar</CardDescription>
            <CardTitle className="capitalize">{title || "Events"}</CardTitle>
          </div>
          <div className="flex flex-col gap-2 xl:items-end">
            <Tabs value={view} onValueChange={changeView}>
              <TabsList className="flex h-auto flex-wrap justify-start gap-1">
                {calendarViews.map((calendarView) => (
                  <TabsTrigger key={calendarView.value} value={calendarView.value}>
                    {calendarView.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <div className="grid gap-2 sm:grid-cols-2">
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                  aria-label="Filter format konten"
                >
                  {contentTypes.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  aria-label="Filter status konten"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => moveCalendar("prev")} aria-label="Sebelumnya">
                  <ChevronLeft className="size-4" />
                </Button>
                <Button variant="outline" onClick={() => moveCalendar("today")}>
                  Hari ini
                </Button>
                <Button variant="outline" size="icon" onClick={() => moveCalendar("next")} aria-label="Berikutnya">
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {contentItems.error && (
            <p className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-sm text-destructive">
              {contentItems.error.message}
            </p>
          )}
          {contentItems.isFetching && (
            <p className="mb-3 text-sm text-muted-foreground">Memuat jadwal konten...</p>
          )}
          <div className="events-calendar-shell">
            <FullCalendar
              ref={calendarRef}
              allDaySlot
              dateClick={handleDateClick}
              datesSet={(info) => {
                setTitle(info.view.title);
                setVisibleRange({
                  start: info.startStr,
                  end: info.endStr,
                });
              }}
              editable
              eventClick={(info) => {
                setSelectedRange(null);
                setSelectedEvent(info.event.extendedProps.item);
              }}
              eventDrop={handleEventChange}
              eventResizableFromStart
              eventResize={handleEventChange}
              eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
              events={events}
              firstDay={1}
              headerToolbar={false}
              height="auto"
              initialView={defaultCalendarView}
              locale={idLocale}
              nowIndicator
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin, multiMonthPlugin]}
              select={(info) => openCreateDialog({ start: info.start, end: info.end, allDay: info.allDay })}
              selectable
              selectMirror
              slotDuration="00:30:00"
              slotMaxTime="23:00:00"
              slotMinTime="06:00:00"
              views={{
                timeGridThreeDay: {
                  type: "timeGrid",
                  duration: { days: 3 },
                  buttonText: "3 days",
                },
              }}
            />
          </div>
        </CardContent>
      </Card>

      <EventsCalendarDialog
        eventItem={selectedEvent}
        open={Boolean(selectedRange || selectedEvent)}
        selectedRange={selectedRange}
        onClose={() => {
          setSelectedRange(null);
          setSelectedEvent(null);
        }}
      />
    </>
  );
}

function mapCalendarEvents(items) {
  return items
    .map((item) => {
      const start = item.startAt ?? item.scheduledAt;

      if (!start) {
        return null;
      }

      return {
        id: item.id,
        title: item.title,
        start,
        end: item.endAt ?? getDefaultEndAt(start, item.allDay),
        allDay: item.allDay ?? false,
        classNames: [typeClasses[item.type] ?? "event-type-default"],
        extendedProps: { item },
      };
    })
    .filter(Boolean);
}

function toSchedulePayload(event) {
  if (!event.start) {
    return null;
  }

  const endAt = event.end ?? getDefaultEndAt(event.start, event.allDay);

  return {
    scheduledAt: event.start.toISOString(),
    startAt: event.start.toISOString(),
    endAt: endAt.toISOString(),
    allDay: event.allDay,
    timezone: event.extendedProps?.item?.timezone ?? getBrowserTimezone(),
  };
}

function getBrowserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone ?? defaultTimezone;
}

function getDefaultEndAt(start, allDay) {
  const startAt = new Date(start);

  if (allDay) {
    return addDays(startAt, 1);
  }

  return addHours(startAt, 1);
}

function addHours(date, hours) {
  const nextDate = new Date(date);
  nextDate.setHours(nextDate.getHours() + hours);
  return nextDate;
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}
