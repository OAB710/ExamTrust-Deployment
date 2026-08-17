import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { SubmissionsService } from '../submissions/submissions.service';

const TZ = 'Asia/Ho_Chi_Minh';
const COMPLETED = ['SUBMITTED', 'GRADED', 'FLAGGED'];

// Read-only cheat sheet of what the Zalo ops bot accepts — kept in sync by
// hand with the ZALO_*_COMMAND constants in zalo-webhook-lambda/index.mjs,
// which is a separate deployable with no shared source of truth to import
// this from.
const ZALO_BOT_COMMANDS = [
  { command: 'System Summary', category: 'Hệ Thống', public: true, description: 'Tổng quan số liệu hệ thống (người dùng, khóa học, bài thi, câu hỏi, tín hiệu giám sát...)' },
  { command: 'Info', category: 'DevOps', public: true, description: 'Xem chi tiết tất cả status về hệ thống' },
  { command: 'Build FE', category: 'DevOps', public: false, description: 'Build + deploy FE lên Cloudflare Workers' },
  { command: 'Build BE', category: 'DevOps', public: false, description: 'Build + deploy BE lên EC2' },
  { command: 'On FE / Off FE', category: 'DevOps', public: false, description: 'Bật / tắt FE (Cloudflare Worker)' },
  { command: 'FE Info / BE Info / R2 Info', category: 'DevOps', public: false, description: 'Xem mức dùng tài nguyên FE, BE, và Cloudflare R2' },
  { command: 'AI Deepseek / AI Openrouter', category: 'DevOps', public: false, description: 'Chuyển provider AI đang dùng' },
  { command: 'Reset DB', category: 'DevOps', public: false, description: '⚠️ Xóa sạch database production và seed lại data demo' },
  { command: 'CQM / CEM / CAM', category: 'DevOps', public: false, description: '⚠️ Xóa vĩnh viễn tệp trên R2 (Clear Question/Evidence/All Media — ảnh câu hỏi / bằng chứng giám sát / cả hai) — không đụng dữ liệu trong database' },
];

@Injectable()
export class AdminDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly submissionsService: SubmissionsService,
  ) {}

  async devopsStatus() {
    return {
      ai: this.aiService.getProviderStatus(),
      botCommands: ZALO_BOT_COMMANDS,
    };
  }

  // Every number here mirrors an existing admin screen's KPI card exactly
  // (same query, same "all roles / all-time, no filters" scope) — see
  // CourseManagement.tsx "Tổng số khóa học", ExamManagement.tsx "Tổng số bài
  // thi"/"Đã công bố"/"Tổng số lượt nộp", QuestionBankManagement.tsx "Tổng số
  // câu hỏi", UserRoleManagement.tsx "Tổng số người dùng". Deliberately does
  // NOT invent any number that isn't already visible somewhere on screen
  // (e.g. no per-role user totals, no "% scored 7+" — neither is displayed
  // anywhere as a single figure today).
  async systemOverview() {
    const [totalUsers, totalCourses, totalExams, publishedExams, totalQuestions, totalSubmissions, integrityCases] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.course.count(),
        this.prisma.exam.count({ where: { deletedAt: null } }),
        this.prisma.exam.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
        this.prisma.question.count(),
        this.prisma.examSubmission.count(),
        // Reuses the exact same query the "Giám sát rủi ro" admin screen
        // calls (no user scope = unfiltered/admin-wide, matching its default
        // view) instead of re-deriving highConfidence/confirmedCases here —
        // that classification logic lives in one place only.
        this.submissionsService.getIntegrityCases({}),
      ]);

    return {
      totalUsers,
      totalCourses,
      totalExams,
      publishedExams,
      totalQuestions,
      totalSubmissions,
      integrity: integrityCases.stats,
    };
  }

  private key(date: Date, bucket: 'day' | 'week' | 'month') {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
    const part = (type: string) => parts.find((p) => p.type === type)?.value || '';
    const day = `${part('year')}-${part('month')}-${part('day')}`;
    if (bucket === 'day') return day;
    if (bucket === 'month') return day.slice(0, 7);
    const local = new Date(`${day}T00:00:00Z`); local.setUTCDate(local.getUTCDate() - ((local.getUTCDay() + 6) % 7));
    return local.toISOString().slice(0, 10);
  }
  private emptySeries(from: Date, to: Date, bucket: 'day' | 'week' | 'month') {
    const rows: any[] = []; const cursor = new Date(from);
    while (cursor <= to) { rows.push({ period: this.key(cursor, bucket), started: 0, completed: 0, signaled: 0, reviewed: 0, students: 0, lecturers: 0, admins: 0 }); cursor.setUTCDate(cursor.getUTCDate() + (bucket === 'day' ? 1 : bucket === 'week' ? 7 : 32)); if (bucket === 'month') cursor.setUTCDate(1); }
    return [...new Map(rows.map((row) => [row.period, row])).values()];
  }
  async analytics(fromRaw?: string, toRaw?: string) {
    const now = new Date(); const from = fromRaw ? new Date(fromRaw) : new Date(now.getTime() - 29 * 86400000); const to = toRaw ? new Date(toRaw) : now;
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to || to.getTime() - from.getTime() > 366 * 86400000) throw new BadRequestException('Khoảng thời gian phân tích không hợp lệ (tối đa 1 năm).');
    const days = Math.ceil((to.getTime() - from.getTime()) / 86400000) + 1; const bucket = days <= 31 ? 'day' : days <= 180 ? 'week' : 'month'; const range = { gte: from, lte: to };
    const [users, submissions, sessions, reviews, activeExams] = await Promise.all([
      this.prisma.user.findMany({ where: { createdAt: range }, select: { createdAt: true, role: true } }),
      this.prisma.examSubmission.findMany({ where: { OR: [{ startedAt: range }, { submittedAt: range }] }, select: { id: true, startedAt: true, submittedAt: true, status: true, score: true, exam: { select: { maxAttempts: true } } } }),
      this.prisma.proctoringSession.findMany({ where: { createdAt: range }, select: { submissionId: true, createdAt: true } }),
      this.prisma.integrityReview.findMany({ where: { decidedAt: range }, select: { decidedAt: true, status: true } }),
      this.prisma.exam.count({ where: { startTime: { lte: now }, endTime: { gte: now }, status: { in: ['PUBLISHED', 'ONGOING'] } } }),
    ]);
    const seed = this.emptySeries(from, to, bucket); const maps = { activity: new Map(seed.map((x) => [x.period, { ...x }])), integrity: new Map(seed.map((x) => [x.period, { ...x }])), users: new Map(seed.map((x) => [x.period, { ...x }])) };
    const row = (map: Map<string, any>, date: Date) => { const key = this.key(date, bucket); const current = map.get(key) || { period: key, started: 0, completed: 0, signaled: 0, reviewed: 0, students: 0, lecturers: 0, admins: 0 }; map.set(key, current); return current; };
    users.forEach((x) => { const r = row(maps.users, x.createdAt); if (x.role === 'STUDENT') r.students++; else if (x.role === 'LECTURER') r.lecturers++; else if (x.role === 'ADMIN') r.admins++; });
    submissions.forEach((x) => { if (x.startedAt && x.startedAt >= from && x.startedAt <= to) row(maps.activity, x.startedAt).started++; if (x.submittedAt && COMPLETED.includes(x.status) && x.submittedAt >= from && x.submittedAt <= to) row(maps.activity, x.submittedAt).completed++; });
    new Set(sessions.map((x) => x.submissionId)).forEach((id) => { const session = sessions.find((x) => x.submissionId === id)!; row(maps.integrity, session.createdAt).signaled++; });
    reviews.forEach((x) => { if (x.decidedAt && x.status !== 'PENDING') row(maps.integrity, x.decidedAt).reviewed++; });
    const scored = submissions.filter((x) => x.submittedAt && COMPLETED.includes(x.status) && x.exam.maxAttempts !== null && x.score !== null && x.score !== undefined); const bands = [{ label: '0–<2', count: 0 }, { label: '2–<4', count: 0 }, { label: '4–<5', count: 0 }, { label: '5–<7', count: 0 }, { label: '7–<8.5', count: 0 }, { label: '8.5–10', count: 0 }];
    scored.forEach((x) => { const score = Math.max(0, Math.min(10, Number(x.score))); const index = score < 2 ? 0 : score < 4 ? 1 : score < 5 ? 2 : score < 7 ? 3 : score < 8.5 ? 4 : 5; bands[index].count++; });
    const pendingReview = await this.prisma.proctoringSession.count({ where: { OR: [{ tabSwitchCount: { gt: 0 } }, { mouseAnomalies: { gt: 0 } }, { logs: { some: {} } }], submission: { integrityReview: { is: null } } } }) + await this.prisma.integrityReview.count({ where: { status: 'PENDING' } });
    return { range: { from: from.toISOString(), to: to.toISOString(), bucket, timeZone: TZ }, kpis: { newUsers: users.length, activeExams, completedSubmissions: submissions.filter((x) => x.submittedAt && COMPLETED.includes(x.status) && x.submittedAt >= from && x.submittedAt <= to).length, pendingReview }, series: { activity: [...maps.activity.values()].sort((a,b) => a.period.localeCompare(b.period)), integrity: [...maps.integrity.values()].sort((a,b) => a.period.localeCompare(b.period)), users: [...maps.users.values()].sort((a,b) => a.period.localeCompare(b.period)) }, scoreDistribution: { sampleSize: scored.length, bands } };
  }
}
