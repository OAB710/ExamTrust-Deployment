import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Every table in the schema except `users`. Wipes all account-adjacent data
// too (sessions, media usage counters, question bank preferences, event
// queue) so the database ends up with nothing but the users table intact.
const TABLES = [
  'media_storage_usage',
  'media_user_storage_usage',
  'question_bank_preferences',
  'exam_link_usages',
  'exam_links',
  'exam_question_snapshots',
  'question_snapshots',
  'exam_snapshots',
  'submission_answers',
  'anomaly_flags',
  'focus_events',
  'tab_switch_events',
  'interaction_logs',
  'proctoring_evidence_captures',
  'integrity_review_audits',
  'integrity_reviews',
  'integrity_logs',
  'proctoring_sessions',
  'score_adjustments',
  'exam_submission_regrade_logs',
  'exam_submissions',
  'exam_instances',
  'exam_questions',
  'exam_quality_review_items',
  'exams',
  'question_usages',
  'question_statistics',
  'ai_generation_records',
  'question_drafts',
  'question_course_scopes',
  'question_topics',
  'question_versions',
  'questions',
  'course_topics',
  'topics',
  'enrollments',
  'courses',
  'event_store',
  'auth_sessions',
];

async function main() {
  try {
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of TABLES) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${table}\``);
    }
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');
    console.log(`Cleared ${TABLES.length} tables. Only the users table was kept intact.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Clear failed:', error);
  process.exit(1);
});
