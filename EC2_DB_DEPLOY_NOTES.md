# Ghi chú DB / hạ tầng cần làm khi deploy lên EC2

> Tổng hợp từ phiên làm việc ngày 2026-08-02. Bỏ qua sự cố khôi phục MySQL trên XAMPP (local, không liên quan production). Chỉ ghi lại phần **DB, dữ liệu, và cấu hình môi trường** — phần code đã nằm trong git, chỉ cần `git pull` + build là đủ, không cần làm gì thêm.

## 1. Việc BẮT BUỘC phải làm khi deploy

### 1.1. Chạy Prisma migration
Repo đã có sẵn 6 migration file (đã commit vào `BE/prisma/migrations/`), nhưng **chưa chắc đã được áp dụng** lên DB đích:

```
20260731120000_add_auth_sessions_and_password_changed_at
20260801120000_add_exam_results_published_at
20260801130000_add_score_adjustments
20260801140000_add_proctoring_evidence_captures
20260802083000_add_scheduled_webcam_capture_slots
20260802100000_add_question_bank_preferences
```

Chạy trên EC2 sau khi build:
```bash
cd BE
npx prisma migrate deploy --schema prisma/schema.prisma
```
Migration `20260731120000_...` tạo bảng `auth_sessions` + cột `users.passwordChangedAt` — **thiếu migration này thì đăng nhập sẽ lỗi 500** (`TypeError: Cannot read properties of undefined (reading 'create')` / cột không tồn tại).

### 1.2. Biến môi trường `.env` (không nằm trong git)

Bổ sung/kiểm tra các biến sau trên EC2 (file `.env` không được commit, phải set thủ công):

```env
# Đang dùng DeepSeek làm AI provider chính (đã tắt Ollama)
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=<API_KEY_THẬT — key hiện tại trong dev là key thử nghiệm, không dùng lại cho prod>
AI_DEEPSEEK_BASE_URL=https://api.deepseek.com
AI_DEEPSEEK_MODEL=deepseek-chat
```

Nếu muốn dùng lại Ollama trên EC2 thay vì DeepSeek: đổi `AI_PROVIDER=ollama` và đảm bảo có Ollama server chạy được từ EC2 (khó khả thi nếu không tự host model trên cùng máy/mạng nội bộ).

### 1.3. Kiểm tra `sql_mode` của MySQL/RDS trên EC2 (khuyến nghị mạnh)

Phát hiện trong phiên: một bug code (đã sửa, xem mục 3) từng khiến MySQL **âm thầm ghi `0000-00-00 00:00:00`** vào cột `NOT NULL` bị thiếu trong câu lệnh `INSERT` thay vì báo lỗi ngay — vì `sql_mode` lúc đó thiếu `STRICT_TRANS_TABLES`. Bug cụ thể đã được vá trong code, nhưng để phòng các lỗi tương tự trong tương lai (raw SQL khác), nên đảm bảo `sql_mode` trên EC2/RDS có `STRICT_TRANS_TABLES` (mặc định của MySQL 8/RDS hiện đại thường đã bật sẵn — chỉ cần xác nhận lại nếu dùng image MySQL cũ hoặc custom).

## 2. CHỈ áp dụng nếu bạn copy/restore nguyên dữ liệu DB dev cũ sang EC2 (không áp dụng nếu tạo DB mới rồi chạy migration + seed từ đầu)

### 2.1. Backfill dữ liệu `exam_questions.updatedAt` bị hỏng

Do bug ở mục 3.1 (đã tồn tại từ trước, không phải do phiên làm việc này gây ra), một số dòng `exam_questions` trong DB dev có `updatedAt = 0000-00-00 00:00:00`, khiến Prisma throw lỗi 500 khi đọc lại (`Value out of range for the type`). Nếu bạn **dump/restore nguyên dữ liệu dev sang EC2**, chạy lệnh sau trước khi đưa vào production:

```sql
UPDATE exam_questions
SET updatedAt = createdAt
WHERE updatedAt = '0000-00-00 00:00:00';
```

Kiểm tra còn sót không:
```sql
SELECT COUNT(*) FROM exam_questions WHERE updatedAt = '0000-00-00 00:00:00';
-- phải trả về 0
```

### 2.2. Dữ liệu test nên dọn trước khi lên production

Trong lúc debug, đã tạo một số dữ liệu test trong DB dev (không phải toàn bộ đã xoá):
- Course `TESTBU-LECT-01` ("TEST BUG DEVB") — **101 câu hỏi test** (copy từ `CLS008` để tái hiện bug ngân hàng câu hỏi).
- Một vài câu hỏi test tạo qua AI Assistant lúc test tính năng Matching (ví dụ nội dung "Bank Problem" về rủi ro ngân hàng).

Nếu bạn dump nguyên DB dev sang production, nên cân nhắc xoá course/câu hỏi test này trước. Tôi **không tự xoá** vì không chắc bạn còn cần dùng để test tiếp hay không.

## 3. KHÔNG cần làm gì thêm (đã nằm sẵn trong code, tự có khi pull + build)

Liệt kê ngắn gọn để bạn biết bối cảnh, không cần thao tác gì thủ công:

1. **`exam_questions.updatedAt` không được ghi khi tạo exam** → sửa trong `BE/src/exams/exams.service.ts` (`insertExamQuestionCompat`), thêm `updatedAt = NOW(3)` vào cả 4 câu `INSERT`. Migration mới không cần vì không đổi schema, chỉ đổi code ghi dữ liệu.
2. **Bộ lọc `courseId` bỏ sót câu hỏi không có dòng trong `question_course_scopes`** → sửa trong `BE/src/questions-v2/questions-v2.service.ts`, giờ khớp cả theo `q.courseId` trực tiếp lẫn qua bảng scope.
3. **Câu hỏi Matching/Ordering lưu `options` rỗng** → khiến câu hỏi hiển thị trống khi sinh viên vào thi. Sửa trong `BE/src/questions-v2` phía tạo câu hỏi (FE: `question-editor-persistence.ts`) để lưu đúng cấu trúc hiển thị an toàn (`options.left/right` cho Matching, thứ tự đúng cho Ordering).
4. **Câu trả lời Ordering chưa từng được nộp bài** (bug FE độc lập, khá nghiêm trọng) → `OrderingRenderer` giờ đã gọi `setAnswer`, và `ExamTaking.tsx` seed đáp án ban đầu ngay khi câu hỏi hiển thị.
5. **Auto-grade cho Matching/Ordering** → `BE/src/submissions/submissions.service.ts` thêm logic so khớp `pairs`/`items`, chỉ áp dụng khi dữ liệu câu hỏi đúng chuẩn (dữ liệu cũ sai cấu trúc vẫn rơi về chấm tay, tránh chấm sai điểm).
6. **Loại câu hỏi "Tìm lỗi sai" (FIND_ERROR)** thiếu ở màn tạo đề thi (`CreateExam.tsx`) — backend & màn thi (`ExamQuestionRenderer.tsx`) đã hỗ trợ sẵn từ trước, chỉ thiếu ở FE tạo đề. Đã bổ sung đủ.
7. **AI Assistant tạo câu hỏi thủ công lúc tạo đề thi** gọi sai endpoint AI (endpoint không có hướng dẫn cho Matching/Ordering) → đổi sang dùng chung endpoint với trang Question Editor.
8. Dịch một loạt text tiếng Anh còn sót sang tiếng Việt (màn tạo đề thi, màn làm bài, màn chấm điểm).
9. Nút "Chọn tất cả / Bỏ chọn tất cả" khi chọn câu hỏi từ ngân hàng lúc tạo đề thi.
10. `GET /courses` bị giới hạn 20 kết quả cho tài khoản Admin (Lecturer đã tự động không giới hạn từ trước) — FE giờ gọi `getCourses({ limit: 200 })`.

## 4. Lưu ý về việc fork sang repo khác

File này được tạo **sau khi bạn đã fork** sang repo mới, nên **sẽ không tự có mặt bên repo fork**. Bạn cần copy thủ công file `EC2_DB_DEPLOY_NOTES.md` này sang repo mới (hoặc merge/pull lại từ repo gốc) nếu muốn giữ lại làm tài liệu tham khảo khi deploy.
