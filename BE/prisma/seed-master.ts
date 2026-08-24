/**
 * SEED TỔNG (bản dựng lại 2026-08-19) — chạy toàn bộ seed demo theo đúng thứ
 * tự phụ thuộc, để làm "DB chuẩn gốc" mỗi khi `npm run db:rebuild` (kể cả khi
 * chạy từ "Reset DB" trên Zalo bot production).
 *
 * Thay thế hoàn toàn bộ 10 script cũ (xem BE/docs/SEED_DATA_ANALYSIS.md và
 * BE/docs/SEED_REBUILD_PLAN.md để biết lý do) — bộ cũ có 2 bug data đã xác
 * nhận (SubmissionAnswer.pointsAwarded không được set; ExamSubmission.status
 * bị set cứng 'GRADED' dù còn câu tự luận chưa chấm) và phụ thuộc vào course
 * CLS001../DATNUO-LECT không còn liên quan tới ExamTrust.
 *
 * Thứ tự bắt buộc (mỗi bước chỉ phụ thuộc bước ngay trước, không nhảy cóc):
 *   1. seed-users                    -> 1 admin, 10 lecturer, 20 student.
 *   2. seed-courses                  -> ~18-20 course (mã sinh theo đúng logic
 *                                        generateCourseCode thật của BE), enrollment.
 *   3. seed-question-bank            -> câu hỏi đủ 7 loại/độ khó/trạng thái + lịch
 *                                        sử phiên bản (DSA).
 *   4. seed-question-bank-duplicates -> case trùng lặp (course Cơ sở Dữ liệu).
 *   5. seed-topics                   -> topic thật theo môn + case tương đồng
 *                                        xuyên course (Mạng máy tính ↔ An toàn TT).
 *   6. seed-exams                    -> đề thi đủ trạng thái (DRAFT/ONGOING/
 *                                        COMPLETED đã & chưa công bố), ma trận đề,
 *                                        nhiều lượt làm.
 *   7. seed-submissions              -> bài làm + chấm điểm ĐÚNG invariant thật
 *                                        của submissions.service.ts (không lặp lại
 *                                        2 bug đã tìm thấy).
 *   8. seed-integrity                -> giám thị/toàn vẹn đủ 10 loại eventType,
 *                                        cặp gian lận, case hoàn thành nhanh.
 *   9. seed-grading-adjustments       -> phúc khảo (regrade log) + điều chỉnh điểm.
 *
 * Mục 8 kế hoạch (AI hỗ trợ tạo câu hỏi/soát đề) đã được xác nhận BỎ QUA —
 * không seed AIGenerationRecord/ExamQualityReviewItem trong bản này.
 *
 * Idempotent: toàn bộ 9 bước dùng upsert/kiểm tra tồn tại trước khi tạo, có
 * thể chạy lại nhiều lần an toàn trên cùng 1 DB.
 *
 * Cách chạy: cd BE && npx ts-node --transpile-only prisma/seed-master.ts
 */
import { main as seedUsers } from './seed-users';
import { main as seedCourses } from './seed-courses';
import { main as seedQuestionBank } from './seed-question-bank';
import { main as seedQuestionBankDuplicates } from './seed-question-bank-duplicates';
import { main as seedTopics } from './seed-topics';
import { main as seedExams, touchDemoExamToTop } from './seed-exams';
import { main as seedSubmissions } from './seed-submissions';
import { main as seedIntegrity } from './seed-integrity';
import { main as seedGradingAdjustments } from './seed-grading-adjustments';
import { main as seedAnalyticsDemo } from './seed-analytics-ui-demo';
import { main as seedDuplicateDemo } from './seed-duplicate-demo';
import { main as seedMonitorDemo } from './seed-monitor-ui-demo';
import { main as seedQuestionHistoryDemo } from './seed-question-history-demo';
import { main as seedTopicSimilarityDemo } from './seed-topic-similarity-demo';

async function main() {
  console.log('\n=== [SEED TỔNG] 1/9 seed-users ===');
  const step1 = await seedUsers();

  console.log('\n=== [SEED TỔNG] 2/9 seed-courses ===');
  const step2 = await seedCourses(step1);

  console.log('\n=== [SEED TỔNG] 3/9 seed-question-bank ===');
  const step3 = await seedQuestionBank(step2);

  console.log('\n=== [SEED TỔNG] 4/9 seed-question-bank-duplicates ===');
  const step4 = await seedQuestionBankDuplicates(step3);

  console.log('\n=== [SEED TỔNG] 5/9 seed-topics ===');
  const step5 = await seedTopics(step4);

  console.log('\n=== [SEED TỔNG] 6/9 seed-exams ===');
  const step6 = await seedExams(step5);

  console.log('\n=== [SEED TỔNG] 7/9 seed-submissions ===');
  const step7 = await seedSubmissions(step6);

  console.log('\n=== [SEED TỔNG] 8/9 seed-integrity ===');
  const step8 = await seedIntegrity(step7);

  console.log('\n=== [SEED TỔNG] 9/9 seed-grading-adjustments ===');
  await seedGradingAdjustments(step8);

  console.log('\n=== [SEED DEMO] 10/14 seed-analytics-ui-demo ===');
  await seedAnalyticsDemo();

  console.log('\n=== [SEED DEMO] 11/14 seed-duplicate-demo ===');
  await seedDuplicateDemo();

  console.log('\n=== [SEED DEMO] 12/14 seed-monitor-ui-demo ===');
  await seedMonitorDemo();

  console.log('\n=== [SEED DEMO] 13/14 seed-question-history-demo ===');
  await seedQuestionHistoryDemo();

  console.log('\n=== [SEED DEMO] 14/14 seed-topic-similarity-demo ===');
  await seedTopicSimilarityDemo();

  console.log('\n=== [SEED TỔNG] Đưa bài thi demo lên đầu danh sách ===');
  await touchDemoExamToTop();

  console.log('\n=== [SEED TỔNG] TOÀN BỘ SEED ĐÃ HOÀN TẤT ===');
}

main().catch((error) => {
  console.error('[SEED TỔNG] Thất bại:', error);
  process.exit(1);
});
