/**
 * SEED TỔNG — chạy toàn bộ seed demo theo đúng thứ tự phụ thuộc, để làm
 * "DB chuẩn gốc" mỗi khi `npm run db:rebuild`.
 *
 * Xem BE/docs/SEED_DATA_ANALYSIS.md để biết lý do thứ tự này và các phụ
 * thuộc/giới hạn của từng bước (bài toán 10 vs 18 vs 36 sinh viên, course
 * CLS00x/DATNUO-LECT bị thiếu, v.v.).
 *
 * Thứ tự bắt buộc:
 *   1. seed-accounts-only   -> đủ 36 sinh viên (522h0001..0036) + lecturer01 + admin.
 *                              Bắt buộc chạy trước vì các bước 8, 9, 10 cần đủ
 *                              student roster (18 hoặc 36 người), nếu thiếu sẽ
 *                              throw lỗi hoặc âm thầm mất tín hiệu demo.
 *   2. seed                 -> seed.ts gốc: 10 lecturer, 10 student (ghi đè lại
 *                              fullName của 522h0001..0010 theo đúng định dạng cũ
 *                              "522h0001" — đây là lựa chọn giữ nguyên seed cũ,
 *                              chạy SAU bước 1 nên fullName cuối cùng là của
 *                              seed.ts), course SEED-101 + 7 câu hỏi mẫu.
 *   3. seed-legacy-course-sections -> khôi phục course CLS001 + 11 lớp học phần
 *                              (DATNUO-LECT-01/02, CLS002..CLS010) từng bị gỡ khỏi
 *                              seed.ts trước v1.0.0 — điều kiện tiên quyết cho 4, 5.
 *   4. seed-course-question-banks  -> 100 câu hỏi chuyên môn/lớp cho các course ở bước 3.
 *   5. seed-cls001-grade1-math     -> demo Toán lớp 1 cho CLS001 (ghi đè mỗi lần chạy).
 *   6. seed-duplicate-demo         -> demo "Lọc câu trùng lặp".
 *   7. seed-topic-similarity-demo  -> demo Topic Similarity AI.
 *   8. seed-question-history-demo  -> cần >= 18 student (đã đủ từ bước 1).
 *   9. seed-analytics-ui-demo      -> cần đủ 36 student (đã đủ từ bước 1).
 *  10. seed-monitor-ui-demo        -> cần đủ 36 student (đã đủ từ bước 1).
 *
 * Idempotent: mọi bước đều dùng upsert/kiểm tra tồn tại (trừ seed-cls001-grade1-math,
 * vốn xoá và tạo lại các câu hỏi `[DEMO-CLS001]` mỗi lần chạy — theo đúng thiết kế gốc).
 *
 * Cách chạy:
 *   cd BE && npx ts-node --transpile-only prisma/seed-master.ts
 */
import { main as seedAccountsOnly } from './seed-accounts-only';
import { main as seedCore } from './seed';
import { main as seedLegacyCourseSections } from './seed-legacy-course-sections';
import { main as seedCourseQuestionBanks } from './seed-course-question-banks';
import { main as seedCls001Grade1Math } from './seed-cls001-grade1-math';
import { main as seedDuplicateDemo } from './seed-duplicate-demo';
import { main as seedTopicSimilarityDemo } from './seed-topic-similarity-demo';
import { main as seedQuestionHistoryDemo } from './seed-question-history-demo';
import { main as seedAnalyticsUiDemo } from './seed-analytics-ui-demo';
import { main as seedMonitorUiDemo } from './seed-monitor-ui-demo';

const STEPS: Array<{ name: string; run: () => Promise<void> }> = [
  { name: '1/10 seed-accounts-only', run: seedAccountsOnly },
  { name: '2/10 seed (core: users + SEED-101 + 7 câu hỏi)', run: seedCore },
  { name: '3/10 seed-legacy-course-sections (CLS001 + DATNUO/CLS00x)', run: seedLegacyCourseSections },
  { name: '4/10 seed-course-question-banks', run: seedCourseQuestionBanks },
  { name: '5/10 seed-cls001-grade1-math', run: seedCls001Grade1Math },
  { name: '6/10 seed-duplicate-demo', run: seedDuplicateDemo },
  { name: '7/10 seed-topic-similarity-demo', run: seedTopicSimilarityDemo },
  { name: '8/10 seed-question-history-demo', run: seedQuestionHistoryDemo },
  { name: '9/10 seed-analytics-ui-demo', run: seedAnalyticsUiDemo },
  { name: '10/10 seed-monitor-ui-demo', run: seedMonitorUiDemo },
];

async function main() {
  for (const step of STEPS) {
    console.log(`\n=== [SEED TỔNG] Bắt đầu ${step.name} ===`);
    await step.run();
    console.log(`=== [SEED TỔNG] Xong ${step.name} ===`);
  }
  console.log('\n=== [SEED TỔNG] TOÀN BỘ SEED ĐÃ HOÀN TẤT ===');
}

main().catch((error) => {
  console.error('[SEED TỔNG] Thất bại:', error);
  process.exit(1);
});
