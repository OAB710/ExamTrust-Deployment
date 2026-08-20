# Ghi chú DB / hạ tầng cần làm khi deploy lên EC2

> Tổng hợp từ phiên làm việc ngày 2026-08-02. Bỏ qua sự cố khôi phục MySQL trên XAMPP (local, không liên quan production). Chỉ ghi lại phần **DB, dữ liệu, và cấu hình môi trường** — phần code đã nằm trong git, chỉ cần `git pull` + build là đủ, không cần làm gì thêm.

## 1. Việc BẮT BUỘC phải làm khi deploy

### 1.1. Chạy Prisma migration — [ĐÃ XONG trên EC2 ngày 2026-08-02]
Repo đã có sẵn 6 migration file (đã commit vào `BE/prisma/migrations/`):

```
20260731120000_add_auth_sessions_and_password_changed_at
20260801120000_add_exam_results_published_at
20260801130000_add_score_adjustments
20260801140000_add_proctoring_evidence_captures
20260802083000_add_scheduled_webcam_capture_slots
20260802100000_add_question_bank_preferences
```

LƯU Ý: `npx prisma migrate deploy` KHÔNG chạy được trên repo này (lịch sử
migration bị thiếu baseline cho 16 bảng cũ, xem CLOUDFLARE_DEPLOY_NOTES.txt
mục 8.4). Cách đã dùng thực tế trên EC2 (giống runbook mục 8.8):
```bash
cd ~/examtrust-be
docker compose --env-file .env.production -f docker-compose.prod.yml \
  run --rm app npx prisma db push --schema prisma/schema.prisma \
  --accept-data-loss --skip-generate
```
Đã chạy thành công ngày 2026-08-02 — "database is now in sync" — cùng lúc
deploy code BE mới nhất (code cũ trên EC2 trước đó chưa có các thay đổi này
chút nào, không chỉ thiếu migration). Migration `20260731120000_...` tạo
bảng `auth_sessions` + cột `users.passwordChangedAt` — thiếu migration này
thì đăng nhập sẽ lỗi 500 (`TypeError: Cannot read properties of undefined
(reading 'create')` / cột không tồn tại) — đã xác nhận hết lỗi sau khi push.

### 1.2. Biến môi trường `.env` (không nằm trong git) — [ĐÃ XONG trên EC2 ngày 2026-08-02]

Đã set trên EC2 (file `.env.production`, không commit, set qua SSH thủ công):

```env
# Đang dùng DeepSeek làm AI provider chính (đã tắt Ollama, đã tắt OpenRouter)
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=<key thật, đã điền trên EC2 — xem CLOUDFLARE_DEPLOY_NOTES.txt mục 9.8 để lấy lại nếu cần>
AI_DEEPSEEK_BASE_URL=https://api.deepseek.com
AI_DEEPSEEK_MODEL=deepseek-chat
```

Đã force-recreate container `app` + `ai-worker`, log xác nhận
"AI provider: DeepSeek @ https://api.deepseek.com (model: deepseek-chat)".

CẢNH BÁO: GitHub Actions secret `BE_ENV_PRODUCTION` (dùng bởi workflow
"Build BE") **CHƯA được cập nhật** theo thay đổi này — vẫn còn giá trị
OpenRouter cũ. Lần tới bấm "Build BE" sẽ ghi đè `.env.production` trên EC2
về lại OpenRouter. Cần tự cập nhật secret này trên GitHub trước khi dùng lại
"Build BE" — xem chi tiết ở CLOUDFLARE_DEPLOY_NOTES.txt mục 9.8(c).
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

## 4. Cập nhật 2026-08-15 — thiếu R2 credentials trên EC2 + lỗi Dockerfile

### 4.1. `.env.production` từng bị mất sạch biến R2 — kiểm tra định kỳ

Phát hiện khi build lệnh Zalo bot "Clear Evidence Media": `docker exec examtrust-be-app-1 printenv | grep R2_` trả về **rỗng**, kể cả trên container `app` đang chạy live — nghĩa là upload ảnh câu hỏi + bằng chứng webcam đã âm thầm lỗi một thời gian trên production (code bắt lỗi kiểu best-effort, không ai để ý). Nghi ngờ nguyên nhân: một lần chạy workflow "Build BE" đã ghi đè `.env.production` bằng nội dung secret GitHub `BE_ENV_PRODUCTION`, và secret đó đang thiếu các biến R2.

Đã fix tạm bằng cách copy 6 biến sau từ `BE/.env` local (khớp bucket `examtrust-media` / account `01d1ca8a9cdddbd927df55d1dbd62924`) vào `.env.production` trên EC2 rồi force-recreate `app` + `ai-worker`:
```
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
R2_ENDPOINT
R2_PUBLIC_BASE_URL
```

**Việc cần tự làm để không lặp lại**: cập nhật secret GitHub `BE_ENV_PRODUCTION` (Settings → Secrets and variables → Actions) bằng nội dung `.env.production` đầy đủ hiện tại trên EC2 — xem chi tiết ở `CLOUDFLARE_DEPLOY_NOTES.txt` mục 9.9(c). Nên định kỳ chạy lệnh kiểm tra nhanh này sau mỗi lần "Build BE":
```bash
ssh -i "C:\Users\oabph\Downloads\examtrust-be-key.pem" ubuntu@32.236.182.208 "docker exec examtrust-be-app-1 printenv | grep '^R2_'"
```
Nếu rỗng là đang lỗi.

### 4.2. `BE/Dockerfile` từng thiếu `COPY scripts` ở stage runtime

Stage `builder` có copy `scripts/` để build, nhưng stage `runtime` (image thật sự chạy production) trước đây không copy — nên mọi file trong `BE/scripts/` (không riêng gì file mới) chưa từng tồn tại trong container production, dù nằm sẵn trong git. Đã thêm dòng `COPY --from=builder /app/scripts ./scripts` vào stage runtime. Nếu sau này thêm script mới cần chạy qua `docker compose run --rm app npx ts-node scripts/...`, nhớ rebuild image (`docker compose -f docker-compose.prod.yml build app`) trước khi dùng — không tự có nếu chỉ scp file lên host.

### 4.3. Lệnh dự phòng (fallback) khi Zalo bot lỗi

File `ZALO_BOT_FALLBACK_COMMANDS.md` ở gốc repo (gitignore, không commit — chứa IP EC2 + đường dẫn SSH key) liệt kê lệnh SSH/docker copy-paste tương ứng 1-1 với từng lệnh bot Zalo (Reset DB, Clear Question/Evidence/All Media, Build BE, On/Off FE, AI Deepseek/Openrouter), dùng khi bot lỗi hoặc chưa deploy code mới.

## 5. Cập nhật 2026-08-17 — sửa 3 chart trống ở trang Tổng quan admin

**KHÔNG cần làm gì thêm** — đã chạy xong trên cả local và EC2 production trong phiên này.

Bug: "Hoạt động nộp bài", "Tín hiệu toàn vẹn", "Tăng trưởng người dùng" trống vì (1) `User.createdAt` toàn bộ 47 user seed đều rơi vào cùng 1 phút (lúc chạy seed), (2) `seed-analytics-ui-demo.ts` dùng ngày cố định tuyệt đối `2026-08-10` nên trôi ra khỏi khung 30 ngày mặc định của trang phân tích theo thời gian, (3) không seed nào từng tạo `IntegrityReview` nên "Đã review"/"Đã xác nhận" luôn bằng 0. Đã sửa cả 3 nguyên nhân trong `BE/prisma/seed-accounts-only.ts`, `seed-analytics-ui-demo.ts`, `seed-monitor-ui-demo.ts` (xem CHANGELOG.md [1.1.4]).

Đã chạy `seed-master.ts` (idempotent, không mất dữ liệu) trực tiếp trên EC2 production đúng runbook mục 8.8 của `CLOUDFLARE_DEPLOY_NOTES.txt` (scp 3 file → `docker compose build app` → `docker compose run --rm app npx ts-node --transpile-only --compiler-options '{"module":"commonjs","moduleResolution":"node"}' prisma/seed-master.ts`) — thành công, không lỗi.

Kèm 1 bug riêng ở FE (`AdminAnalyticsDashboard.tsx`): component `ChartCard` không truyền `data` xuống `<LineChart>`/`<BarChart>` bên trong nên Recharts luôn vẽ trống dù mảng dữ liệu không rỗng — không liên quan gì đến seed/DB, chỉ là code FE thiếu 1 dòng `cloneElement(children, { data })`.

## 6. Lưu ý về việc fork sang repo khác

File này được tạo **sau khi bạn đã fork** sang repo mới, nên **sẽ không tự có mặt bên repo fork**. Bạn cần copy thủ công file `EC2_DB_DEPLOY_NOTES.md` này sang repo mới (hoặc merge/pull lại từ repo gốc) nếu muốn giữ lại làm tài liệu tham khảo khi deploy.

## 7. Cập nhật — dựng lại toàn bộ seed data (xem BE/docs/SEED_REBUILD_PLAN.md)

**Mục 3 và mục 5 ở trên đã LỖI THỜI** — nói về `prisma/seed.ts`, `seed-accounts-only.ts`, `seed-analytics-ui-demo.ts`, `seed-monitor-ui-demo.ts`: các file này **đã bị xoá hoàn toàn**, thay bằng bộ seed mới 9 bước (`seed-users.ts` → ... → `seed-grading-adjustments.ts`, orchestrate bởi `seed-master.ts`). Chi tiết đầy đủ ở `BE/docs/SEED_REBUILD_PLAN.md`.

Điểm khác biệt cần biết khi deploy/chạy trên EC2:
- **20 sinh viên** (không phải 36/10 như các bản seed cũ), không còn course `CLS001`/`DATNUO-LECT-xx`.
- Toàn bộ course dồn về `lecturer01@tdtutdtu.edu.vn` (1 tài khoản sở hữu hết, theo yêu cầu).
- `npm run db:rebuild` / lệnh bot "Reset DB" giờ chạy `seed-master.ts` mới — **nếu production đang có dữ liệu demo cũ (36 sinh viên, CLS001) và ai đó bấm Reset DB sau khi deploy code mới, dữ liệu sẽ đổi hoàn toàn sang cấu trúc mới này.** Không phải bug, nhưng cần báo trước cho ai đang dùng data cũ để test/chụp màn hình.
- Kèm sửa bug thật ở `BE/src/submissions/submissions.service.ts` (câu chấm tay lưu `isCorrect=null` lúc nộp bài thay vì `false`) — sửa đúng nguyên nhân ma trận đáp án hiện sai "Sai" cho câu chưa chấm. Không cần migration, chỉ cần "Build BE" bình thường.
