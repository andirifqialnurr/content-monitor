"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpenText,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileText,
  LayoutGrid,
  ListChecks,
  MonitorCheck,
  Newspaper,
  Search,
  Video,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cadence, files, formats, timeline, topics, weeklyCalendar } from "@/data/content";
import { cn } from "@/lib/utils";

const statusLabels = {
  carousel: "Carousel",
  short: "Video",
  article: "Artikel",
  linkedin: "LinkedIn",
};

export default function Home() {
  const [activeView, setActiveView] = useState("timeline");
  const [cadenceMode, setCadenceMode] = useState("minimum");
  const [query, setQuery] = useState("");
  const [cluster, setCluster] = useState("Semua");
  const [pillar, setPillar] = useState("Semua");
  const [selectedTopicId, setSelectedTopicId] = useState(topics[0].id);
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

  const clusters = useMemo(() => ["Semua", ...new Set(topics.map((topic) => topic.cluster))], []);
  const pillars = useMemo(() => ["Semua", ...new Set(topics.map((topic) => topic.pillar))], []);

  const filteredTopics = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return topics.filter((topic) => {
      const matchesCluster = cluster === "Semua" || topic.cluster === cluster;
      const matchesPillar = pillar === "Semua" || topic.pillar === pillar;
      const searchable = [
        topic.id,
        topic.title,
        topic.pain,
        topic.promise,
        topic.carousel,
        topic.short,
        topic.article,
        topic.linkedin,
        topic.cta,
        ...(topic.folders ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesCluster && matchesPillar && (!normalized || searchable.includes(normalized));
    });
  }, [cluster, pillar, query]);

  const selectedTopic = topics.find((topic) => topic.id === selectedTopicId) ?? filteredTopics[0] ?? topics[0];
  const completedCount = Object.values(done).filter(Boolean).length;
  const totalTimelineItems = timeline.length * formats.length;
  const progress = Math.round((completedCount / totalTimelineItems) * 100);

  function toggleStatus(week, key) {
    const id = `week-${week}-${key}`;
    setDone((current) => ({ ...current, [id]: !current[id] }));
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-r bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-md bg-primary text-primary-foreground">
              <MonitorCheck className="size-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-normal">Content Monitor</h1>
              <p className="text-sm text-muted-foreground">Kanal IT pribadi</p>
            </div>
          </div>

          <Separator className="my-5" />

          <Tabs value={activeView} onValueChange={setActiveView} orientation="vertical">
            <TabsList className="grid h-auto w-full grid-cols-1 gap-1 bg-transparent p-0">
              <TabsTrigger value="timeline" className="justify-start gap-2 data-[state=active]:bg-accent">
                <CalendarDays className="size-4" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="topics" className="justify-start gap-2 data-[state=active]:bg-accent">
                <ClipboardList className="size-4" />
                Bank Topik
              </TabsTrigger>
              <TabsTrigger value="files" className="justify-start gap-2 data-[state=active]:bg-accent">
                <FileText className="size-4" />
                File Markdown
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardDescription>Progress 12 pekan</CardDescription>
              <CardTitle className="text-3xl">{progress}%</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={progress} />
              <p className="mt-3 text-sm text-muted-foreground">
                {completedCount}/{totalTimelineItems} output selesai
              </p>
            </CardContent>
          </Card>
        </aside>

        <section className="min-w-0 p-4 md:p-6">
          <header className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Fundamental software engineering di era AI
              </p>
              <h2 className="mt-1 text-3xl font-semibold tracking-normal">
                {activeView === "timeline"
                  ? "Timeline Publikasi"
                  : activeView === "topics"
                    ? "Bank Topik Konten"
                    : "Referensi Markdown"}
              </h2>
            </div>

            <Button asChild variant="outline">
              <a href="/api/docs/channel" target="_blank">
                Buka Markdown
                <ChevronRight className="size-4" />
              </a>
            </Button>
          </header>

          {activeView === "timeline" && (
            <TimelineView
              cadenceMode={cadenceMode}
              setCadenceMode={setCadenceMode}
              done={done}
              toggleStatus={toggleStatus}
            />
          )}

          {activeView === "topics" && (
            <TopicView
              clusters={clusters}
              cluster={cluster}
              setCluster={setCluster}
              pillars={pillars}
              pillar={pillar}
              setPillar={setPillar}
              query={query}
              setQuery={setQuery}
              filteredTopics={filteredTopics}
              selectedTopic={selectedTopic}
              setSelectedTopicId={setSelectedTopicId}
            />
          )}

          {activeView === "files" && <FilesView />}
        </section>
      </div>
    </main>
  );
}

function TimelineView({ cadenceMode, setCadenceMode, done, toggleStatus }) {
  return (
    <div className="grid gap-4">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<LayoutGrid />} label="Carousel / Post" value="1x" note="per minggu minimum" />
        <Metric icon={<Video />} label="Video Pendek" value="1x" note="per minggu minimum" />
        <Metric icon={<Newspaper />} label="Blog / Medium" value="2x" note="per bulan minimum" />
        <Metric icon={<ListChecks />} label="Cheatsheet" value="1x" note="per 1-2 minggu" />
      </section>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardDescription>Frekuensi</CardDescription>
            <CardTitle>Target Posting</CardTitle>
          </div>
          <Tabs value={cadenceMode} onValueChange={setCadenceMode}>
            <TabsList>
              <TabsTrigger value="minimum">Minimum</TabsTrigger>
              <TabsTrigger value="normal">Normal</TabsTrigger>
              <TabsTrigger value="stretch">Stretch</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {cadence[cadenceMode].map(([label, value]) => (
            <div key={label} className="rounded-md border bg-muted/30 p-3">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-2 font-semibold">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Publikasi</CardDescription>
          <CardTitle>Kalender Mingguan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          {weeklyCalendar.map(([day, item]) => (
            <div key={day} className="rounded-md border-l-4 border-primary bg-accent/50 p-3">
              <p className="font-semibold">{day}</p>
              <p className="mt-2 text-sm text-muted-foreground">{item}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>12 pekan</CardDescription>
          <CardTitle>Timeline Produksi</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {timeline.map((week) => (
            <article key={week.week} className="grid gap-3 rounded-md border bg-muted/20 p-3 xl:grid-cols-[240px_minmax(0,1fr)]">
              <div className="flex gap-3">
                <Badge className="h-9 rounded-md px-3">W{week.week}</Badge>
                <div>
                  <h3 className="font-semibold">{week.theme}</h3>
                  <p className="text-sm text-muted-foreground">{week.topicId}</p>
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                <Deliverable week={week.week} type="carousel" value={week.carousel} done={done} onToggle={toggleStatus} />
                <Deliverable week={week.week} type="short" value={week.short} done={done} onToggle={toggleStatus} />
                <Deliverable week={week.week} type="article" value={week.article} done={done} onToggle={toggleStatus} />
                <Deliverable week={week.week} type="linkedin" value={week.linkedin} done={done} onToggle={toggleStatus} />
              </div>
            </article>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function TopicView({
  clusters,
  cluster,
  setCluster,
  pillars,
  pillar,
  setPillar,
  query,
  setQuery,
  filteredTopics,
  selectedTopic,
  setSelectedTopicId,
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
      <Card className="xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)]">
        <CardHeader>
          <CardDescription>Bank data</CardDescription>
          <CardTitle>{filteredTopics.length} topik</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari topik, folder, format..."
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <Select value={cluster} onValueChange={setCluster}>
              <SelectTrigger>
                <SelectValue placeholder="Cluster" />
              </SelectTrigger>
              <SelectContent>
                {clusters.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={pillar} onValueChange={setPillar}>
              <SelectTrigger>
                <SelectValue placeholder="Pilar" />
              </SelectTrigger>
              <SelectContent>
                {pillars.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid max-h-[520px] gap-2 overflow-auto pr-1">
            {filteredTopics.map((topic) => (
              <Button
                key={topic.id}
                variant={selectedTopic?.id === topic.id ? "secondary" : "outline"}
                className="h-auto justify-start whitespace-normal p-3 text-left"
                onClick={() => setSelectedTopicId(topic.id)}
              >
                <span className="grid gap-1">
                  <span className="text-xs font-semibold text-primary">{topic.id}</span>
                  <span>{topic.title}</span>
                  <span className="text-xs font-normal text-muted-foreground">{topic.pillar}</span>
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardDescription>
              {selectedTopic.id} / {selectedTopic.pillar}
            </CardDescription>
            <CardTitle className="text-2xl">{selectedTopic.title}</CardTitle>
          </div>
          <Badge variant="secondary">{selectedTopic.cluster}</Badge>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Brief label="Pain" value={selectedTopic.pain} />
            <Brief label="Promise" value={selectedTopic.promise} />
            <Brief label="CTA" value={selectedTopic.cta} />
          </div>

          {selectedTopic.folders && (
            <div className="flex flex-wrap gap-2">
              {selectedTopic.folders.map((folder) => (
                <code key={folder} className="rounded-md border bg-muted px-2 py-1 text-xs">
                  {folder}
                </code>
              ))}
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <FormatCard icon={<LayoutGrid />} label="IG / Carousel" value={selectedTopic.carousel} />
            <FormatCard icon={<Video />} label="Video Pendek" value={selectedTopic.short} />
            <FormatCard icon={<Newspaper />} label="Blog / Medium" value={selectedTopic.article} />
            <FormatCard icon={<BookOpenText />} label="LinkedIn" value={selectedTopic.linkedin ?? "Pakai angle profesional dari carousel/artikel"} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FilesView() {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Referensi</CardDescription>
        <CardTitle>File Markdown</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {files.map((file) => (
          <Card key={file.path} className="shadow-none">
            <CardHeader>
              <FileText className="size-5 text-primary" />
              <CardTitle className="text-base">{file.name}</CardTitle>
              <CardDescription>{file.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" size="sm">
                <a href={file.path} target="_blank">
                  Buka
                  <ChevronRight className="size-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}

function Metric({ icon, label, value, note }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground [&_svg]:size-4">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-semibold">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}

function Deliverable({ week, type, value, done, onToggle }) {
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
        <span className="text-xs font-semibold text-muted-foreground">{statusLabels[type]}</span>
        <Checkbox checked={checked} aria-label={`${statusLabels[type]} minggu ${week}`} />
      </div>
      <strong className="text-sm leading-relaxed">{value}</strong>
    </div>
  );
}

function Brief({ label, value }) {
  return (
    <Card className="shadow-none">
      <CardHeader className="p-4">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-base leading-relaxed">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function FormatCard({ icon, label, value }) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardDescription className="flex items-center gap-2 [&_svg]:size-4">
          {icon}
          {label}
        </CardDescription>
        <CardTitle className="text-lg leading-relaxed">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
