"use client";

import { useEffect, useState } from "react";
import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc/react";

const contentTypes = [
  { value: "VIDEO_SHORT", label: "Video Short" },
  { value: "CAROUSEL_POST", label: "Carousel Post" },
  { value: "BLOG", label: "Blog" },
  { value: "LONG_VIDEO", label: "Long Video" },
];

const statusOptions = [
  { value: "DRAFT", label: "Draft" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

const defaultTimezone = "Asia/Jakarta";

export function EventsCalendarDialog({ date, eventItem, open, selectedRange, onClose }) {
  const mode = eventItem ? "edit" : "create";
  const utils = trpc.useUtils();
  const [type, setType] = useState("VIDEO_SHORT");
  const [status, setStatus] = useState("SCHEDULED");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [startValue, setStartValue] = useState("");
  const [endValue, setEndValue] = useState("");
  const [timezone, setTimezone] = useState(defaultTimezone);
  const [error, setError] = useState("");

  const createMutation = trpc.contentItems.create.useMutation({
    onSuccess: () => {
      utils.contentItems.list.invalidate();
      onClose();
    },
    onError: (mutationError) => setError(mutationError.message),
  });
  const updateMutation = trpc.contentItems.update.useMutation({
    onSuccess: () => {
      utils.contentItems.list.invalidate();
      onClose();
    },
    onError: (mutationError) => setError(mutationError.message),
  });
  const deleteMutation = trpc.contentItems.delete.useMutation({
    onSuccess: () => {
      utils.contentItems.list.invalidate();
      onClose();
    },
    onError: (mutationError) => setError(mutationError.message),
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    const nextAllDay = eventItem?.allDay ?? selectedRange?.allDay ?? false;
    const startAt = getInitialStart({ date, eventItem, selectedRange });
    const endAt = getInitialEnd({ allDay: nextAllDay, eventItem, selectedRange, startAt });

    setType(eventItem?.type ?? "VIDEO_SHORT");
    setStatus(eventItem?.status ?? "SCHEDULED");
    setTitle(eventItem?.title ?? "");
    setBody(eventItem?.body ?? "");
    setAllDay(nextAllDay);
    setStartValue(toInputValue(startAt, nextAllDay, false));
    setEndValue(toInputValue(endAt, nextAllDay, true));
    setTimezone(eventItem?.timezone ?? getBrowserTimezone());
    setError("");
  }, [date, eventItem, open, selectedRange]);

  if (!open) {
    return null;
  }

  const pending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  function handleAllDayChange(checked) {
    const nextAllDay = Boolean(checked);
    const startAt = parseInputValue(startValue, allDay, false);
    const endAt = parseInputValue(endValue, allDay, true) ?? getDefaultEndAt(startAt, nextAllDay);

    setAllDay(nextAllDay);
    setStartValue(toInputValue(startAt, nextAllDay, false));
    setEndValue(toInputValue(endAt, nextAllDay, true));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const startAt = parseInputValue(startValue, allDay, false);
    const endAt = parseInputValue(endValue, allDay, true);

    if (!startAt || !endAt || endAt <= startAt) {
      setError("Waktu selesai harus setelah waktu mulai.");
      return;
    }

    const payload = {
      type,
      title,
      body,
      status,
      scheduledAt: startAt.toISOString(),
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      allDay,
      timezone,
    };

    if (mode === "edit") {
      updateMutation.mutate({ id: eventItem.id, ...payload });
      return;
    }

    createMutation.mutate(payload);
  }

  function handleDelete() {
    if (eventItem) {
      deleteMutation.mutate({ id: eventItem.id });
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 p-4">
      <div className="w-full max-w-lg rounded-md border bg-card shadow-lg">
        <div className="flex items-start justify-between gap-3 border-b p-4">
          <div>
            <p className="text-sm text-muted-foreground">Events</p>
            <h2 className="text-lg font-semibold">{mode === "edit" ? "Edit Event Konten" : "Tambah Event Konten"}</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Tutup modal">
            <X className="size-4" />
          </Button>
        </div>

        <form className="grid gap-3 p-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium">
              Format
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={type}
                onChange={(event) => setType(event.target.value)}
              >
                {contentTypes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-sm font-medium">
              Status
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="grid gap-1 text-sm font-medium">
            Judul
            <Input value={title} onChange={(event) => setTitle(event.target.value)} required />
          </label>

          <label className="flex items-center gap-2 text-sm font-medium">
            <Checkbox checked={allDay} onCheckedChange={handleAllDayChange} />
            Seharian
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium">
              {allDay ? "Tanggal mulai" : "Mulai"}
              <Input
                type={allDay ? "date" : "datetime-local"}
                value={startValue}
                onChange={(event) => setStartValue(event.target.value)}
                required
              />
            </label>

            <label className="grid gap-1 text-sm font-medium">
              {allDay ? "Tanggal selesai" : "Selesai"}
              <Input
                type={allDay ? "date" : "datetime-local"}
                value={endValue}
                onChange={(event) => setEndValue(event.target.value)}
                required
              />
            </label>
          </div>

          <label className="grid gap-1 text-sm font-medium">
            Timezone
            <Input value={timezone} onChange={(event) => setTimezone(event.target.value)} required />
          </label>

          <label className="grid gap-1 text-sm font-medium">
            Catatan
            <textarea
              className="min-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={body}
              onChange={(event) => setBody(event.target.value)}
            />
          </label>

          {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-sm text-destructive">{error}</p>}

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-between">
            {mode === "edit" ? (
              <Button type="button" variant="outline" onClick={handleDelete} disabled={pending}>
                <Trash2 className="size-4" />
                Hapus
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit" disabled={pending}>
                {mode === "edit" ? "Simpan" : "Tambah"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function getInitialStart({ date, eventItem, selectedRange }) {
  const eventStart = eventItem?.startAt ?? eventItem?.scheduledAt;

  return new Date(eventStart ?? selectedRange?.start ?? date ?? new Date());
}

function getInitialEnd({ allDay, eventItem, selectedRange, startAt }) {
  const eventEnd = eventItem?.endAt;

  if (eventEnd || selectedRange?.end) {
    return new Date(eventEnd ?? selectedRange.end);
  }

  return getDefaultEndAt(startAt, allDay);
}

function getDefaultEndAt(startAt, allDay) {
  const endAt = new Date(startAt ?? new Date());

  if (allDay) {
    endAt.setDate(endAt.getDate() + 1);
    return endAt;
  }

  endAt.setHours(endAt.getHours() + 1);
  return endAt;
}

function parseInputValue(value, allDay, isEnd) {
  if (!value) {
    return null;
  }

  if (!allDay) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = parseDateValue(value);

  if (isEnd) {
    date.setDate(date.getDate() + 1);
  }

  return date;
}

function parseDateValue(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function toInputValue(date, allDay, isEnd) {
  if (allDay) {
    return toDateInputValue(getAllDayDisplayDate(date, isEnd));
  }

  return toDateTimeInputValue(date);
}

function getAllDayDisplayDate(date, isEnd) {
  const displayDate = new Date(date ?? new Date());

  if (isEnd && displayDate.getHours() === 0 && displayDate.getMinutes() === 0) {
    displayDate.setDate(displayDate.getDate() - 1);
  }

  return displayDate;
}

function toDateInputValue(date) {
  const source = new Date(date ?? new Date());
  const year = source.getFullYear();
  const month = String(source.getMonth() + 1).padStart(2, "0");
  const day = String(source.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toDateTimeInputValue(date) {
  const source = new Date(date ?? new Date());

  if (source.getHours() === 0 && source.getMinutes() === 0) {
    source.setHours(9, 0, 0, 0);
  }

  const year = source.getFullYear();
  const month = String(source.getMonth() + 1).padStart(2, "0");
  const day = String(source.getDate()).padStart(2, "0");
  const hours = String(source.getHours()).padStart(2, "0");
  const minutes = String(source.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getBrowserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone ?? defaultTimezone;
}
