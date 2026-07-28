"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import { vi } from "date-fns/locale";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BackToDashboardButton } from "@/components/common/BackToDashboardButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/lib/api";
import { getUiStatus } from "@/lib/presentation";

type CalendarView = "day" | "week" | "month";

type ScheduleExamItem = {
  id: string;
  title?: string;
  status?: string;
  startTime?: string | null;
  endTime?: string | null;
  duration?: number;
  course?: { id?: string; code?: string; name?: string };
  submitted?: boolean;
};

const HOURS = Array.from({ length: 13 }, (_, index) => index + 7);

function getEventTone(item: ScheduleExamItem) {
  if (item.submitted) return "border-slate-300 bg-slate-100 text-slate-700";
  if (String(item.status).toUpperCase() === "ONGOING") {
    return "border-emerald-300 bg-emerald-50 text-emerald-900";
  }
  return "border-sky-300 bg-sky-50 text-sky-900";
}

function getStatusLabel(item: ScheduleExamItem) {
  if (item.submitted) return "Đã nộp";
  return getUiStatus(item.status || "PUBLISHED").label;
}

function toDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function StudentSchedule() {
  const [items, setItems] = useState<ScheduleExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<CalendarView>("week");
  const [cursorDate, setCursorDate] = useState(() => startOfDay(new Date()));
  const [courseCode, setCourseCode] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ScheduleExamItem | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadSchedule = async () => {
      try {
        setLoading(true);
        const [availableExams, submissions] = await Promise.all([api.getAvailableExams(), api.getMySubmissions()]);
        if (!mounted) return;
        const submittedIds = new Set(
          (submissions || [])
            .filter((item: any) => ["SUBMITTED", "GRADED", "FLAGGED", "FINALIZED"].includes(String(item.status || "").toUpperCase()))
            .map((item: any) => String(item.examId || item.exam?.id || "")),
        );
        setItems((availableExams || []).map((exam: any) => ({
          id: String(exam.id), title: exam.title, status: exam.status, startTime: exam.startTime,
          endTime: exam.endTime, duration: exam.duration, course: exam.course,
          submitted: submittedIds.has(String(exam.id)),
        })));
      } catch (error) {
        console.error("Failed to load student schedule", error);
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadSchedule();
    return () => { mounted = false; };
  }, []);

  const courses = useMemo(() => Array.from(new Set(items.map((item) => item.course?.code).filter(Boolean))) as string[], [items]);
  const filteredItems = useMemo(() => items.filter((item) => {
    const matchesCourse = courseCode === "all" || item.course?.code === courseCode;
    const needle = search.trim().toLocaleLowerCase();
    const matchesSearch = !needle || [item.title, item.course?.code, item.course?.name].join(" ").toLocaleLowerCase().includes(needle);
    return matchesCourse && matchesSearch;
  }), [courseCode, items, search]);
  const scheduledItems = useMemo(() => filteredItems.filter((item) => toDate(item.startTime)), [filteredItems]);
  const flexibleItems = useMemo(() => filteredItems.filter((item) => !toDate(item.startTime)), [filteredItems]);

  const visibleDays = useMemo(() => {
    if (view === "day") return [cursorDate];
    if (view === "week") {
      const start = startOfWeek(cursorDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end: endOfWeek(cursorDate, { weekStartsOn: 1 }) });
    }
    const first = startOfWeek(startOfMonth(cursorDate), { weekStartsOn: 1 });
    const last = endOfWeek(endOfMonth(cursorDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start: first, end: last });
  }, [cursorDate, view]);

  const moveCursor = (direction: -1 | 1) => {
    setCursorDate((current) => view === "day" ? (direction > 0 ? addDays(current, 1) : subDays(current, 1)) :
      view === "week" ? (direction > 0 ? addWeeks(current, 1) : subWeeks(current, 1)) :
        (direction > 0 ? addMonths(current, 1) : subMonths(current, 1)));
  };
  const periodLabel = view === "day"
    ? format(cursorDate, "EEEE, dd 'tháng' M", { locale: vi })
    : view === "week"
      ? `${format(visibleDays[0], "dd/MM")} – ${format(visibleDays[visibleDays.length - 1], "dd/MM/yyyy")}`
      : format(cursorDate, "MMMM 'năm' yyyy", { locale: vi });

  const eventsForDay = (day: Date) => scheduledItems.filter((item) => {
    const start = toDate(item.startTime);
    return start && isSameDay(start, day);
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <BackToDashboardButton to="/student" className="-ml-2" />

        <section className="rounded-xl border border-border bg-card/80 p-4 shadow-sm">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Lịch thi</h1>
              <p className="mt-1 text-sm text-muted-foreground">Theo dõi các ca thi theo thời gian để không bỏ lỡ bài thi.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm bài thi hoặc khóa học" className="w-full sm:w-64" />
              <Select value={courseCode} onValueChange={setCourseCode}>
                <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">Tất cả khóa học</SelectItem>{courses.map((code) => <SelectItem key={code} value={code}>{code}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <Card className="overflow-hidden shadow-medium">
          <CardHeader className="gap-4 border-b border-border bg-muted/30 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><CalendarClock className="h-5 w-5" /></span>Lịch các ca thi</CardTitle>
              <CardDescription className="mt-1">Mỗi khối là một ca thi trong khung thời gian được công bố.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCursorDate(startOfDay(new Date()))}>Hôm nay</Button>
              <Button variant="outline" size="icon" aria-label="Kỳ trước" onClick={() => moveCursor(-1)}><ChevronLeft className="h-4 w-4" /></Button>
              <p className="min-w-40 text-center text-sm font-semibold capitalize">{periodLabel}</p>
              <Button variant="outline" size="icon" aria-label="Kỳ tiếp theo" onClick={() => moveCursor(1)}><ChevronRight className="h-4 w-4" /></Button>
              <div className="flex rounded-md border border-input bg-background p-0.5">
                {(["day", "week", "month"] as CalendarView[]).map((option) => <Button key={option} size="sm" variant={view === option ? "default" : "ghost"} className="h-8 px-3" onClick={() => setView(option)}>{option === "day" ? "Ngày" : option === "week" ? "Tuần" : "Tháng"}</Button>)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? <div className="py-20 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></div> :
              view === "month" ? <MonthCalendar days={visibleDays} cursorDate={cursorDate} eventsForDay={eventsForDay} onSelect={setSelected} /> :
                <TimeCalendar days={visibleDays} eventsForDay={eventsForDay} onSelect={setSelected} />}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-base">Bài thi linh hoạt</CardTitle><CardDescription>Những bài không có khung thời gian cố định sẽ không xuất hiện trên lịch.</CardDescription></CardHeader>
          <CardContent>{flexibleItems.length === 0 ? <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Không có bài thi linh hoạt phù hợp.</p> : <div className="grid gap-3 md:grid-cols-2">{flexibleItems.map((item) => <FlexibleExamCard key={item.id} item={item} onSelect={setSelected} />)}</div>}</CardContent>
        </Card>
      </div>

      <ExamDetailsDialog item={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </DashboardLayout>
  );
}

function MonthCalendar({ days, cursorDate, eventsForDay, onSelect }: { days: Date[]; cursorDate: Date; eventsForDay: (day: Date) => ScheduleExamItem[]; onSelect: (item: ScheduleExamItem) => void }) {
  return <div className="overflow-x-auto"><div className="min-w-[760px]"><div className="grid grid-cols-7 border-b bg-muted/20">{["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"].map((label) => <div key={label} className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">{label}</div>)}</div><div className="grid grid-cols-7">{days.map((day) => <div key={day.toISOString()} className={`min-h-32 border-b border-r border-border p-2 ${!isSameMonth(day, cursorDate) ? "bg-muted/20 text-muted-foreground" : "bg-card"}`}><span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm ${isToday(day) ? "bg-primary font-semibold text-primary-foreground" : ""}`}>{format(day, "d")}</span><div className="mt-1 space-y-1">{eventsForDay(day).slice(0, 3).map((item) => <button key={item.id} onClick={() => onSelect(item)} className={`block w-full truncate rounded border px-1.5 py-1 text-left text-xs font-medium ${getEventTone(item)}`}>{format(toDate(item.startTime)!, "HH:mm")} · {item.title}</button>)}{eventsForDay(day).length > 3 && <p className="px-1 text-xs text-muted-foreground">+{eventsForDay(day).length - 3} bài thi</p>}</div></div>)}</div></div></div>;
}

function TimeCalendar({ days, eventsForDay, onSelect }: { days: Date[]; eventsForDay: (day: Date) => ScheduleExamItem[]; onSelect: (item: ScheduleExamItem) => void }) {
  return <div className="overflow-x-auto"><div className="min-w-[780px]"><div className="grid border-b bg-muted/20" style={{ gridTemplateColumns: `64px repeat(${days.length}, minmax(140px, 1fr))` }}><div />{days.map((day) => <div key={day.toISOString()} className={`border-l border-border px-2 py-3 text-center ${isToday(day) ? "bg-primary/5" : ""}`}><p className="text-xs text-muted-foreground capitalize">{format(day, "EEE", { locale: vi })}</p><p className={`mx-auto mt-1 flex h-7 w-7 items-center justify-center rounded-full text-sm ${isToday(day) ? "bg-primary font-semibold text-primary-foreground" : ""}`}>{format(day, "d")}</p></div>)}</div><div className="relative" style={{ minHeight: `${HOURS.length * 68}px` }}>{HOURS.map((hour) => <div key={hour} className="absolute left-0 right-0 flex" style={{ top: `${(hour - HOURS[0]) * 68}px` }}><div className="w-16 -translate-y-2 pr-2 text-right text-xs text-muted-foreground">{String(hour).padStart(2, "0")}:00</div><div className="h-px flex-1 bg-border" /></div>)}<div className="ml-16 grid h-full" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(140px, 1fr))` }}>{days.map((day) => <div key={day.toISOString()} className="relative border-l border-border">{eventsForDay(day).map((item) => { const start = toDate(item.startTime)!; const end = toDate(item.endTime); const startMinutes = start.getHours() * 60 + start.getMinutes(); const top = Math.max(0, ((startMinutes - HOURS[0] * 60) / 60) * 68); const duration = end ? Math.max(36, ((end.getTime() - start.getTime()) / 3600000) * 68) : 52; return <button key={item.id} onClick={() => onSelect(item)} className={`absolute inset-x-1 overflow-hidden rounded-md border p-2 text-left text-xs shadow-sm transition hover:brightness-95 ${getEventTone(item)}`} style={{ top, height: duration }}><span className="block font-semibold leading-4">{item.title}</span><span className="mt-1 block truncate opacity-75">{format(start, "HH:mm")} · {item.course?.code}</span></button>; })}</div>)}</div></div></div></div>;
}

function FlexibleExamCard({ item, onSelect }: { item: ScheduleExamItem; onSelect: (item: ScheduleExamItem) => void }) {
  return <button onClick={() => onSelect(item)} className="rounded-lg border border-border p-4 text-left transition hover:border-primary/40 hover:bg-muted/30"><p className="font-semibold">{item.title}</p><p className="mt-1 text-sm text-muted-foreground">{item.course?.code} · {item.course?.name}</p><div className="mt-3 flex items-center justify-between"><Badge variant="outline" className={getEventTone(item)}>{getStatusLabel(item)}</Badge><span className="text-sm text-primary">Xem chi tiết</span></div></button>;
}

function ExamDetailsDialog({ item, onOpenChange }: { item: ScheduleExamItem | null; onOpenChange: (open: boolean) => void }) {
  const start = toDate(item?.startTime); const end = toDate(item?.endTime);
  return <Dialog open={Boolean(item)} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{item?.title}</DialogTitle><DialogDescription>{item?.course?.code} · {item?.course?.name}</DialogDescription></DialogHeader>{item && <div className="space-y-3 rounded-lg border bg-muted/20 p-4 text-sm"><div className="flex items-start gap-3"><Clock3 className="mt-0.5 h-4 w-4 text-primary" /><div><p className="font-medium">Thời gian thi</p><p className="text-muted-foreground">{start ? format(start, "HH:mm, EEEE dd/MM/yyyy", { locale: vi }) : "Không có lịch cố định"}{end ? ` – ${format(end, "HH:mm")}` : ""}</p></div></div>{item.duration ? <p><span className="font-medium">Thời lượng: </span>{item.duration} phút</p> : null}<Badge variant="outline" className={getEventTone(item)}>{getStatusLabel(item)}</Badge></div>}<DialogFooter><Button asChild><Link href={`/student/exams/${item?.id}`}>{item?.submitted ? "Xem chi tiết" : "Vào trang bài thi"}</Link></Button></DialogFooter></DialogContent></Dialog>;
}
