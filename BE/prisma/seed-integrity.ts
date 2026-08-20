import { PrismaClient } from '@prisma/client';
import { addMinutes, makeRng, seedFromString } from './seed-helpers';
import { main as seedSubmissions } from './seed-submissions';

const prisma = new PrismaClient();

// All 10 real IntegrityLog.eventType values used by the proctoring client
// (BE/prisma/SEED_DATA_ANALYSIS.md + prior seed-monitor-ui-demo.ts). Cycled
// deterministically across flagged sessions so every type gets several rows,
// spread across different exams/weeks instead of one submission.
const EVENT_TYPES = [
  'tab_switch', 'mouse_anomaly', 'mouse_idle', 'copy', 'paste',
  'fullscreen_exit', 'window_blur', 'face_not_detected',
  'camera_stream_ended', 'camera_recovery_timeout',
];

const FAST_STUDENT_INDEX = 1;
const CHEATER_INDICES = [18, 19];

export async function main(seeded?: Awaited<ReturnType<typeof seedSubmissions>>) {
  try {
    const result = seeded ?? (await seedSubmissions());
    const { submissionsByExamKey, examsByKey, studentUsers } = result;

    const flatEntries: Array<{ examKey: string; submission: any; studentIndex: number }> = [];
    for (const [examKey, rows] of Object.entries(submissionsByExamKey)) {
      const plan = examsByKey[examKey].plan;
      if (plan.status === 'ONGOING') continue; // in-progress sessions have no completed proctoring evidence yet
      for (const row of rows) flatEntries.push({ examKey, ...row });
    }

    let eventTypeCursor = 0;
    let sessionsCreated = 0;
    let logsCreated = 0;
    let reviewsCreated = 0;

    const rng = makeRng(seedFromString('integrity:general'));

    async function flagEntry(entry: typeof flatEntries[number], opts: { reviewStatus?: 'PENDING' | 'REVIEWED' | 'CONFIRMED' | 'DISMISSED'; penaltyPercent?: number; logCount?: number }) {
      const { submission } = entry;
      const tabSwitchCount = Math.round(1 + rng() * 5);
      const mouseAnomalies = Math.round(rng() * 3);
      const session = await prisma.proctoringSession.upsert({
        where: { submissionId: submission.id },
        update: {},
        create: {
          submissionId: submission.id,
          tabSwitchCount,
          mouseAnomalies,
          flaggedStatus: opts.reviewStatus === 'CONFIRMED' ? 'flagged' : null,
          integrityScore: Math.max(0, 1 - (tabSwitchCount + mouseAnomalies) * 0.08),
          createdAt: submission.submittedAt ?? submission.createdAt,
        },
      });
      sessionsCreated += 1;

      const logCount = opts.logCount ?? Math.round(2 + rng() * 3);
      for (let i = 0; i < logCount; i++) {
        const eventType = EVENT_TYPES[eventTypeCursor % EVENT_TYPES.length];
        eventTypeCursor += 1;
        const timestamp = addMinutes(submission.startedAt ?? submission.createdAt, rng() * 30);
        await prisma.integrityLog.upsert({
          where: { proctoringId_clientEventId: { proctoringId: session.id, clientEventId: `seed-${submission.id}-${i}` } },
          update: {},
          create: {
            proctoringId: session.id,
            clientEventId: `seed-${submission.id}-${i}`,
            eventType,
            details: `Ghi nhận tự động (${eventType}) trong phiên thi.`,
            timestamp,
          },
        });
        logsCreated += 1;
      }

      if (opts.reviewStatus) {
        const penaltyPercent = opts.penaltyPercent ?? 0;
        const academicScore = Number(submission.score ?? 0);
        const deductedScore = Math.round(academicScore * (penaltyPercent / 100) * 100) / 100;
        const finalScore = Math.max(0, Math.round((academicScore - deductedScore) * 100) / 100);
        await prisma.integrityReview.upsert({
          where: { submissionId: submission.id },
          update: {},
          create: {
            submissionId: submission.id,
            status: opts.reviewStatus,
            reviewerNote: opts.reviewStatus === 'PENDING'
              ? null
              : opts.reviewStatus === 'CONFIRMED'
                ? 'Phát hiện dấu hiệu gian lận rõ ràng (đáp án trùng bất thường với sinh viên khác).'
                : 'Đã xem xét, không đủ căn cứ xử lý.',
            decidedAt: opts.reviewStatus === 'PENDING' ? null : addMinutes(submission.submittedAt ?? submission.createdAt, 60 * 24),
            penaltyMode: penaltyPercent > 0 ? 'PERCENT' : null,
            penaltyPercent: penaltyPercent > 0 ? penaltyPercent : null,
            academicScore,
            deductedScore: penaltyPercent > 0 ? deductedScore : null,
            finalScore: penaltyPercent > 0 ? finalScore : academicScore,
          },
        });
        reviewsCreated += 1;
      }
    }

    // 1) General signal: ~18% of eligible submissions get flagged with mixed
    // review outcomes, so the "signaled vs reviewed" chart has two different,
    // non-trivial series across many weeks.
    for (const entry of flatEntries) {
      if (CHEATER_INDICES.includes(entry.studentIndex) || entry.studentIndex === FAST_STUDENT_INDEX) continue;
      if (rng() > 0.18) continue;
      const roll = rng();
      const reviewStatus = roll < 0.4 ? 'PENDING' : roll < 0.7 ? 'REVIEWED' : roll < 0.85 ? 'CONFIRMED' : 'DISMISSED';
      await flagEntry(entry, { reviewStatus, penaltyPercent: reviewStatus === 'CONFIRMED' ? Math.round(10 + rng() * 30) : 0 });
    }

    // 2) Cheater pair (mục 2 kế hoạch): flagged + CONFIRMED with a penalty on
    // every exam they share, matching the identical-answer pattern already
    // built into seed-submissions.ts.
    const cheaterEntries = flatEntries.filter((e) => CHEATER_INDICES.includes(e.studentIndex));
    for (const entry of cheaterEntries) {
      await flagEntry(entry, { reviewStatus: 'CONFIRMED', penaltyPercent: 30, logCount: 5 });
    }

    // 3) Fast-finishing student: flagged as an anomaly (unusually short
    // completion time), reviewed and dismissed as legitimate — a real
    // "signal that turned out fine" case, not treated as cheating.
    const fastEntries = flatEntries.filter((e) => e.studentIndex === FAST_STUDENT_INDEX);
    let anomalyFlagsCreated = 0;
    for (const entry of fastEntries) {
      const instance = await prisma.examInstance.findUnique({
        where: { examId_studentId: { examId: entry.submission.examId, studentId: studentUsers[FAST_STUDENT_INDEX].id } },
      });
      if (!instance) continue;
      await prisma.examInstance.update({
        where: { id: instance.id },
        data: { anomalyScore: 0.7, suspiciousFlag: true },
      });
      await prisma.anomalyFlag.create({
        data: {
          examInstanceId: instance.id,
          kind: 'FAST_COMPLETION',
          score: 0.7,
          status: 'DISMISSED',
          notes: 'Hoàn thành nhanh bất thường — đối chiếu cho thấy học lực tốt, không có dấu hiệu gian lận khác.',
          reviewedAt: addMinutes(entry.submission.submittedAt ?? entry.submission.createdAt, 60 * 12),
        },
      });
      anomalyFlagsCreated += 1;
    }

    console.log(`[seed-integrity] sessions=${sessionsCreated} logs=${logsCreated} reviews=${reviewsCreated} anomalyFlags=${anomalyFlagsCreated}`);
    return result;
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && process.argv[1].includes('seed-integrity.ts')) {
  main().catch((error) => {
    console.error('[seed-integrity] failed:', error);
    process.exit(1);
  });
}
