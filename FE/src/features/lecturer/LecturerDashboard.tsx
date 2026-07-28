"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { HelpedTitle } from "@/components/common/ContextHelp";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Plus,
  FileText,
  Clock,
  ArrowRight,
  BookOpen,
  Loader2,
  Sparkles,
  Zap,
  Database,
  Layers3,
  BarChart3,
} from "lucide-react";
import { format, addHours } from "date-fns";
import Link from "next/link";
import api, { unwrapPaginatedData } from "@/lib/api";
import { AttentionSection } from "./attention/AttentionSection";

export interface Exam {
  id: string;
  title: string;
  course: { code: string; name: string };
  duration: number;
  totalPoints: number;
  status: string;
  startTime: string | null;
  createdAt: string;
  _count?: { examQuestions: number; submissions: number };
}

interface CourseSummary {
  id: string;
  code: string;
  name: string;
  enrolledStudents?: number;
  _count?: { enrollments?: number; exams?: number };
}

interface QuestionItem {
  id: string;
  type?: string | null;
  difficulty?: number | null;
  updatedAt?: string | null;
  createdAt?: string | null;
  courseId?: string | null;
  course?: {
    id?: string | null;
    code?: string | null;
    name?: string | null;
  } | null;
}

interface QuestionBankSummary {
  courseId: string;
  courseCode: string;
  courseName: string;
  questionCount: number;
  avgDifficulty: number;
  questionTypes: string[];
  lastUpdatedAt: string | null;
}

const questionTypeLabels: Record<string, string> = {
  MULTIPLE_CHOICE: "Multiple choice",
  TRUE_FALSE: "True/False",
  SHORT_ANSWER: "Short answer",
  ESSAY: "Essay",
  FILL_BLANK: "Fill in the blank",
  MATCHING: "Matching",
  ORDERING: "Ordering",
  FIND_ERROR: "Find the error",
};

const formatDifficulty = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return "Not available";
  if (value < 1.8) return "Easy";
  if (value < 2.6) return "Medium";
  return "Hard";
};

const formatRecentDate = (value: string | null) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const buildQuestionBankSummaries = (
  questions: QuestionItem[],
  courses: CourseSummary[],
): QuestionBankSummary[] => {
  const courseById = new Map(courses.map((course) => [course.id, course]));
  const courseByCode = new Map(courses.map((course) => [course.code, course]));
  const grouped = new Map<
    string,
    {
      courseId: string;
      courseCode: string;
      courseName: string;
      difficulties: number[];
      questionTypes: Set<string>;
      questionCount: number;
      lastUpdatedAt: string | null;
    }
  >();

  questions.forEach((question) => {
    const course =
      (question.courseId && courseById.get(question.courseId)) ||
      (question.course?.id && courseById.get(question.course.id)) ||
      (question.course?.code && courseByCode.get(question.course.code)) ||
      null;
    const courseId = course?.id || question.courseId || question.course?.id || "";
    const courseCode = course?.code || question.course?.code || "General";
    const courseName = course?.name || question.course?.name || "No course assigned";
    const key = courseId || courseCode;
    const current =
      grouped.get(key) ||
      {
        courseId,
        courseCode,
        courseName,
        difficulties: [],
        questionTypes: new Set<string>(),
        questionCount: 0,
        lastUpdatedAt: null,
      };

    current.questionCount += 1;
    if (typeof question.difficulty === "number") {
      current.difficulties.push(question.difficulty);
    }
    if (question.type) {
      current.questionTypes.add(question.type);
    }

    const updatedAt = question.updatedAt || question.createdAt || null;
    if (
      updatedAt &&
      (!current.lastUpdatedAt ||
        new Date(updatedAt).getTime() > new Date(current.lastUpdatedAt).getTime())
    ) {
      current.lastUpdatedAt = updatedAt;
    }

    grouped.set(key, current);
  });

  return Array.from(grouped.values())
    .map((item) => ({
      courseId: item.courseId,
      courseCode: item.courseCode,
      courseName: item.courseName,
      questionCount: item.questionCount,
      avgDifficulty:
        item.difficulties.length > 0
          ? item.difficulties.reduce((sum, value) => sum + value, 0) /
            item.difficulties.length
          : 0,
      questionTypes: Array.from(item.questionTypes),
      lastUpdatedAt: item.lastUpdatedAt,
    }))
    .sort((a, b) => {
      const aTime = a.lastUpdatedAt ? new Date(a.lastUpdatedAt).getTime() : 0;
      const bTime = b.lastUpdatedAt ? new Date(b.lastUpdatedAt).getTime() : 0;
      return bTime - aTime;
    });
};

function AiAssistantCard() {
  return (
    <Card className="card-elevated h-full overflow-hidden relative">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
      <CardContent className="relative flex h-full flex-col justify-center pt-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">AI Assistant</h3>
            <p className="text-xs text-muted-foreground">Create questions with AI</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Use AI to propose questions from course materials, then review them before use.
        </p>
        <Button asChild variant="outline" className="w-full rounded-xl gap-2" size="sm">
          <Link href="/lecturer/question-bank">
            <Zap className="h-4 w-4" />
            Open question bank
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function LecturerDashboard() {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [questionBanks, setQuestionBanks] = useState<QuestionBankSummary[]>([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [examsData, questionsData, coursesData] = await Promise.all([
          api.getExams(),
          api.listQuestions(),
          api.getMyCourses(),
        ]);
        const questions = unwrapPaginatedData<QuestionItem>(questionsData);
        const normalizedCourses = Array.isArray(coursesData)
          ? coursesData
          : unwrapPaginatedData<CourseSummary>(coursesData);

        setExams(unwrapPaginatedData(examsData));
        setQuestionCount(questions.length);
        setCourses(normalizedCourses);
        setQuestionBanks(buildQuestionBankSummaries(questions, normalizedCourses));
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Loading dashboard...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="animate-fade-in opacity-0">
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back, {user?.fullName.split(" ")[0]}
            </h1>
            <p className="text-muted-foreground mt-1">
              An overview of your courses, exams, and question bank.
            </p>
          </div>
          <Button
            asChild
            className="rounded-xl shadow-sm gap-2 shine animate-fade-in opacity-0"
            style={{ animationDelay: "0.1s" }}
          >
            <Link href="/lecturer/exams/create">
              <Plus className="h-4 w-4" />
              Create exam
            </Link>
          </Button>
        </div>

        <div className="grid items-stretch gap-6 xl:grid-cols-2">
          <AttentionSection />
          <AiAssistantCard />
        </div>

        <div className="grid items-stretch gap-6 xl:grid-cols-2">
          {/* Recent Exams */}
          <div>
            <Card className="card-elevated flex h-full flex-col">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">
                    Recent exams
                  </CardTitle>
                  <CardDescription>Most recently updated exams</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-primary gap-1 rounded-xl"
                  asChild
                >
                  <Link href="/lecturer/exams">
                    View all
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-3">
                  {exams.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground font-medium">
                        No exams yet
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Create your first exam to get started
                      </p>
                      <Button asChild className="mt-4 rounded-xl" size="sm">
                        <Link href="/lecturer/exams/create">
                          <Plus className="mr-2 h-4 w-4" />
                          Create exam
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    exams.slice(0, 4).map((exam, i) => {
                      const questionCount = exam._count?.examQuestions || 0;
                      const now = Date.now();
                      const start = exam.startTime
                        ? new Date(exam.startTime)
                        : null;
                      const end = start
                        ? new Date(
                            start.getTime() + (exam.duration || 0) * 60000,
                          )
                        : null;
                      const isScheduled = start ? now < start.getTime() : false;
                      const isExpired = end ? end.getTime() < now : false;
                      const isLiveByTime =
                        !!start &&
                        !!end &&
                        now >= start.getTime() &&
                        now <= end.getTime();
                      const shouldMonitor =
                        exam.status === "ONGOING" || isLiveByTime;
                      const shouldShowResults =
                        exam.status === "COMPLETED" || isExpired;
                      const actionLabel = shouldMonitor
                        ? "Monitor"
                        : shouldShowResults
                          ? "View results"
                          : "Preview and edit";
                      const actionHref = shouldMonitor
                        ? `/lecturer/exam/${exam.id}/monitor`
                        : shouldShowResults
                          ? `/lecturer/exam/${exam.id}/results`
                          : `/lecturer/exam/${exam.id}/preview`;
                      return (
                        <div
                          key={exam.id}
                          className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-xl border border-border/50 p-4 hover:bg-secondary/50 hover:border-primary/10 transition-all duration-200 animate-fade-in opacity-0 stagger-${i + 1}`}
                        >
                          <div className="min-w-0 space-y-2">
                            <div className="flex min-w-0 items-start gap-2.5">
                              <h4 className="line-clamp-2 font-semibold leading-5 text-foreground">
                                {exam.title}
                              </h4>
                              {isExpired ? (
                                <StatusBadge tone="danger" className="shrink-0">
                                  Expired
                                </StatusBadge>
                              ) : (
                                <StatusBadge status={exam.status} domain="exam" className="shrink-0" />
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                              <span className="font-medium">
                                {exam.course?.code}
                              </span>
                              <span className="flex items-center gap-1 whitespace-nowrap">
                                <BookOpen className="h-3.5 w-3.5" />
                                {questionCount} questions
                              </span>
                              <span className="flex items-center gap-1 whitespace-nowrap">
                                <Clock className="h-3.5 w-3.5" />
                                {exam.duration} minutes
                              </span>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            {exam.status === "COMPLETED" && (
                              <div className="text-right">
                                <p className="text-lg font-bold text-foreground">
                                  {exam._count?.submissions || 0}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Submissions
                                </p>
                              </div>
                            )}
                            {isScheduled &&
                              exam.status === "PUBLISHED" &&
                              exam.startTime && (
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-foreground">
                                    {format(new Date(exam.startTime), "MMM d")}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Scheduled
                                  </p>
                                </div>
                              )}
                            <Button size="sm" className="min-w-28 rounded-xl" asChild>
                              <Link href={actionHref}>{actionLabel}</Link>
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right panel */}
          <div className="flex">
            <Card className="card-elevated flex h-full w-full flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">
                  <HelpedTitle help="Courses with recently updated questions, so you can quickly return to question-bank management.">
                    Recent question banks
                  </HelpedTitle>
                </CardTitle>
                <CardDescription>
                  Courses with the most recently updated questions
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col space-y-3">
                {questionBanks.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 p-4 text-center">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Database className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      No questions in the question bank
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Add questions or use AI to prepare an exam for this course.
                    </p>
                    <Button asChild size="sm" className="mt-4 rounded-xl">
                      <Link href="/lecturer/question-editor">
                        <Plus className="mr-2 h-4 w-4" />
                        Add questions
                      </Link>
                    </Button>
                  </div>
                ) : (
                  questionBanks.slice(0, 4).map((bank) => (
                    <Link
                      key={bank.courseId || bank.courseCode}
                      href={`/lecturer/question-bank?courseCode=${encodeURIComponent(bank.courseCode)}${bank.courseId ? `&courseId=${encodeURIComponent(bank.courseId)}` : ""}`}
                      className="block rounded-lg border border-border/60 p-3 transition-colors hover:border-primary/20 hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      aria-label={`Open question bank for ${bank.courseCode}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="line-clamp-1 text-sm font-semibold text-foreground">
                            {bank.courseName}
                          </p>
                          <p className="line-clamp-1 text-xs text-muted-foreground">
                            {bank.courseCode}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold tabular-nums text-primary">
                          {bank.questionCount}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <BarChart3 className="h-3.5 w-3.5" />
                          {formatDifficulty(bank.avgDifficulty)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {formatRecentDate(bank.lastUpdatedAt)}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {bank.questionTypes.slice(0, 2).map((type) => (
                          <span
                            key={type}
                            className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground"
                          >
                            <Layers3 className="h-3 w-3" />
                            {questionTypeLabels[type] || type}
                          </span>
                        ))}
                        {bank.questionTypes.length > 2 ? (
                          <span className="rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                            +{bank.questionTypes.length - 2} types
                          </span>
                        ) : null}
                      </div>
                    </Link>
                  ))
                )}
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="mt-auto w-full rounded-xl"
                >
                  <Link href="/lecturer/question-bank">
                    Manage question bank
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* AI Quick Action */}
            <Card className="hidden card-elevated overflow-hidden relative">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
              <CardContent className="pt-6 relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">
                      <HelpedTitle help="AI helps draft questions from documents or prompts; lecturers still need to review them before use.">
                        AI Assistant
                      </HelpedTitle>
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Create questions with AI
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Use AI to propose questions from course materials, then review them before use.
                  content.
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="w-full rounded-xl gap-2"
                  size="sm"
                >
                  <Link href="/lecturer/question-bank">
                    <Zap className="h-4 w-4" />
                    Open question bank
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}



