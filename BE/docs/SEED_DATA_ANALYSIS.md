# Phân tích Seed Data (kể từ v1.0.0) — đã gộp thành 1 file seed tổng

Ngày phân tích: 2026-08-16
Phạm vi: mọi thay đổi trong `BE/prisma/*.ts` kể từ tag `v1.0.0` đến `HEAD` (`main`, commit `0af6e6d9`), cộng với các script liên quan bị phụ thuộc gián tiếp.

> **Cập nhật (đã triển khai theo yêu cầu):** Toàn bộ đề xuất ở mục 7 đã được thực hiện.
> Xem mục 8 ở cuối file để biết chi tiết những gì đã thay đổi và đã kiểm thử.

## 1. Các commit liên quan kể từ v1.0.0

```
git log --oneline v1.0.0..HEAD
0af6e6d9 BIG SEED DATA
8123ab4f Hotfix: Question-preview ở analytics ...
bbcb9b09 Hotfix: thể hiện đúng số lượng câu hỏi ...
```

Chỉ có **1 commit** động tới seed data: `0af6e6d9 "BIG SEED DATA"`.

```
git diff --stat v1.0.0..HEAD -- prisma/
BE/prisma/seed-analytics-ui-demo.ts     | 661 (mới)
BE/prisma/seed-duplicate-demo.ts        | 121 (mới)
BE/prisma/seed-monitor-ui-demo.ts       | 320 (mới)
BE/prisma/seed-question-history-demo.ts| 248 (sửa lớn, file đã có từ trước qua commit 1cc605ff)
BE/prisma/seed-topic-similarity-demo.ts | 182 (mới)
```

`prisma/seed.ts` (file chạy bởi `npm run seed`) **KHÔNG bị thay đổi** trong khoảng này — nó đã ở dạng hiện tại (7 câu hỏi mẫu) từ trước v1.0.0, tại commit `71d6c3d5`.

## 2. `npm run db:rebuild` thực sự chạy gì

`BE/package.json:22`
```
"db:rebuild": "prisma db push --force-reset --accept-data-loss --schema prisma/schema.prisma && npm run seed"
```
`"seed": "ts-node prisma/seed.ts"` (package.json:25)

→ **`db:rebuild` chỉ xoá sạch DB rồi chạy DUY NHẤT `prisma/seed.ts`.** Không có script nào khác (kể cả 2 script có sẵn lệnh npm riêng: `seed:question-banks`, `seed:question-history-demo`) được gọi tự động. Đúng như anh mô tả: "cập nhật lại seed user và 7 câu hỏi mẫu".

`prisma/seed.ts` tạo (đã xác nhận đọc toàn bộ file, dòng 1-260):
- 1 admin (`admin@tdtutdtu.edu.vn`)
- 10 lecturer (`lecturer01`..`lecturer10@tdtutdtu.edu.vn`)
- 10 student (`522h0001`..`522h0010@tdtutdtu.edu.vn`, fullName = chính MSSV, vd `"522h0001"`)
- 1 course `SEED-101`, 1 lecturer đầu tiên làm chủ, 1 student đầu tiên enroll
- 7 câu hỏi (đủ 7 loại: MULTIPLE_CHOICE, TRUE_FALSE, ESSAY, FILL_IN_BLANK, MATCHING, ORDERING, FIND_ERROR)
- Toàn bộ dùng `upsert`/`findFirst-or-create` → **idempotent**, chạy lại an toàn.

## 3. Danh sách script demo mới (không nằm trong db:rebuild)

Tất cả các file dưới đây phải chạy tay bằng `ts-node --transpile-only prisma/<file>.ts` (ghi rõ trong header comment của từng file), 2 file có thêm alias trong package.json (`seed:question-banks`, `seed:question-history-demo`).

| File | Course code tạo | Yêu cầu có sẵn (dependency) | Idempotent | Ghi chú |
|---|---|---|---|---|
| `seed-accounts-only.ts` | — (không tạo course) | không | Có (upsert) | Tạo **36 student** (`522h0001..0036`, fullName `"Student 522hXXXX"`) + 1 admin + **1 lecturer** (`lecturer01`) only. Viết cho mục đích "reset production data" (commit `ad2ef1d6`). |
| `seed-analytics-ui-demo.ts` | `ANALYTICS-2026` | `lecturer01` phải tồn tại; **cần đủ 36 student `522h0001..0036`** để dữ liệu tín hiệu đúng thiết kế | Có (upsert) | 16 câu hỏi, 1 bài thi, 36 lượt làm bài mô phỏng fast-completion (index 30, 31) + collusion pair (index 34, 35). |
| `seed-monitor-ui-demo.ts` | `MONITOR-2026` | `lecturer01`; **cần đủ 36 student** | Có (upsert) | 33/36 profile có submission, còn lại 3 "chưa tham gia". Collusion index cứng ở 11 & 12. |
| `seed-duplicate-demo.ts` | `DUPLICATE-2026` | chỉ cần `lecturer01` | Có (idempotent qua `metadata.seededDuplicateKey`, không dedup theo `content` vì cố ý tạo câu trùng) | Không phụ thuộc student. |
| `seed-topic-similarity-demo.ts` | `TOPIC-DEMO-DB` | chỉ cần `lecturer01` | Có (upsert theo course.code + topic composite) | Không phụ thuộc student. Chỉ tạo Topic, không tạo Question/Exam. |
| `seed-question-history-demo.ts` | `QHIST-2026` | `lecturer01`; **cần đủ 18 student `522h0001..0018`, nếu thiếu sẽ `throw Error` và dừng hẳn** (dòng 98: `if (usedStudents.length < STUDENTS_PER_EXAM) throw new Error('Thiếu sinh viên; hãy chạy seed accounts trước.')`) | Có (upsert) | Đây là script **fail cứng** (không giống 2 script trên chỉ `console.warn` rồi bỏ qua). |
| `seed-course-question-banks.ts` | không tạo course, chỉ nạp câu hỏi vào course có sẵn | **Bắt buộc các course `DATNUO-LECT-01`, `DATNUO-LECT-02`, `CLS002`..`CLS010`, `CLS001` đã tồn tại từ trước** (dòng 63: `if (!course) throw new Error(...)`) | Nửa vời (không tạo mới nếu đã đủ 100 câu/lớp) | **Hiện KHÔNG có script nào trong repo tạo các course này** (xem mục 4). |
| `seed-cls001-grade1-math.ts` | không tạo course | **Bắt buộc course `CLS001` đã tồn tại** (dòng 130-132: `throw new Error('Khong tim thay lop CLS001. Hay chay seed chinh truoc.')`) | Không — xoá hết câu hỏi cũ có prefix `[DEMO-CLS001]` rồi tạo lại mỗi lần chạy (dòng 140-147) | Đây là bản seed toán lớp 1 (60 câu), file tiếng Việt không dấu, khác hẳn ngữ cảnh "7 câu hỏi mẫu"/ExamTrust hiện tại. |

## 4. Phát hiện quan trọng — có dẫn chứng

### 4.1. `seed-course-question-banks.ts` và `seed-cls001-grade1-math.ts` hiện KHÔNG THỂ chạy được trên DB mới (reset từ `db:rebuild`)

- `seed.ts` phiên bản hiện tại chỉ tạo course `SEED-101`, không tạo `CLS001` hay `CLS002..010`, `DATNUO-LECT-01/02`.
- Kiểm tra lịch sử: `prisma/seed.ts` ở commit gốc `0391dc31` ("mang project tu repo cu qua") **từng** tạo course `CLS001` (36 student, đề SQL...). Bản này bị thay thế hoàn toàn bởi bản "SEED-101 / 7 câu hỏi" tại commit `71d6c3d5`, **trước** v1.0.0.
- Tìm trong toàn repo (`grep -rl "CLS001"`) không có file `.ts` nào khác tạo course này — chỉ có các script `check-*`/`verify-*`/`backfill-enrollments.ts` **đọc** và sẽ `throw`/`abort` nếu không thấy CLS001.
- Kết luận: `seed-course-question-banks.ts`, `seed-cls001-grade1-math.ts`, `verify-cls001-demo.ts`, `backfill-enrollments.ts`, `check-cls001-student-exams.ts`, `check-student-522h0121.ts`, `seed-completed-submissions-522h0121.ts` đều là di sản gắn với dữ liệu CLS001 **chỉ tồn tại trên DB production/dev cũ**, không tái tạo được từ bộ seed hiện có. Nếu gộp toàn bộ seed file thành 1 và chạy trên DB mới `db:rebuild`, 2 script `seed-course-question-banks.ts` và `seed-cls001-grade1-math.ts` sẽ **crash ngay ở dòng throw** vì course không tồn tại.

### 4.2. `seed-question-history-demo.ts` sẽ crash nếu chỉ chạy `npm run seed` (10 student) trước nó

- Dòng 25: `STUDENTS_PER_EXAM = 18`
- Dòng 98: `if (usedStudents.length < STUDENTS_PER_EXAM) throw new Error(...)`
- `prisma/seed.ts` chỉ tạo 10 student → chạy `seed-question-history-demo.ts` ngay sau `npm run seed` sẽ **ném lỗi và dừng**, không phải lỗi "âm thầm sai dữ liệu" mà là crash rõ ràng.

### 4.3. `seed-analytics-ui-demo.ts` và `seed-monitor-ui-demo.ts` KHÔNG crash nhưng lặng lẽ tạo thiếu tín hiệu demo nếu chỉ có 10 student

Cả 2 file chỉ `console.warn` rồi `continue` khi thiếu student (analytics dòng 517-520; monitor dòng 225), nên **không báo lỗi** nhưng vẫn "chạy xong" với dữ liệu không đúng như mô tả trong chính comment đầu file:

- `seed-analytics-ui-demo.ts` dòng 42-44: cần index sinh viên 30, 31 (fast HIGH/REVIEW) và 34, 35 (cặp collusion) — tất cả đều >= index 10 (tức `522h0011` trở lên). Nếu chỉ có 10 student (`522h0001..0010` từ `seed.ts`), **toàn bộ 4 tín hiệu này bị bỏ qua**, phần "Tín hiệu toàn vẹn" trên UI Analytics mà comment mô tả (dòng 4-11: "2 bài làm nhanh bất thường, 1 cặp trùng mẫu trả lời") sẽ **không xuất hiện**, dù script "chạy thành công".
- `seed-monitor-ui-demo.ts` dòng 33-34 (`STUDENT_COUNT = 36`), collusion index cứng tại dòng 260 (`studentIndex === 11 || studentIndex === 12`), và các profile "REVIEW"/phân bố điểm nằm ở index 10-32. Với chỉ 10 student, chỉ 10/36 phiên làm bài được tạo (3 FLAGGED + 6 IN_PROGRESS + 1 fast-HIGH ở index 9) — mất hẳn phần "hoàn thành nhanh REVIEW", toàn bộ collusion pair, và phần lớn phân bố điểm số mà comment đầu file (dòng 6-19) mô tả là mục tiêu của script.

→ Người chạy 2 script này ngay sau `npm run seed` (không chạy `seed-accounts-only.ts` trước) sẽ có console log "hoàn tất" (`=== Seed ... hoàn tất ===`) nhưng UI demo **thiếu đúng phần tín hiệu quan trọng nhất** mà script được viết ra để minh hoạ.

### 4.4. Chỉ có `seed-accounts-only.ts` tạo đủ 36 student, nhưng bản thân nó KHÔNG được gọi bởi `db:rebuild` và không có alias trong `package.json`

- File này (thêm ở commit `ad2ef1d6`, trước v1.0.0) là điều kiện tiên quyết thực sự cho `seed-analytics-ui-demo.ts`, `seed-monitor-ui-demo.ts`, `seed-question-history-demo.ts` — đúng như dòng "hãy chạy seed accounts trước" lặp lại trong cả 3 file (vd `seed-question-history-demo.ts:78`).
- Nhưng nó không có lệnh `npm run seed:accounts` nào cả — phải gõ tay `npx ts-node prisma/seed-accounts-only.ts`.

### 4.5. Lệch dữ liệu nhỏ giữa `seed.ts` và `seed-accounts-only.ts` cho cùng 10 student đầu (522h0001..0010)

Cả 2 script `upsert` theo cùng `email`/`studentId`, nhưng gán `fullName` khác nhau:
- `seed.ts:16`: `fullName: id` → ví dụ `"522h0001"`
- `seed-accounts-only.ts:14`: `fullName: \`Student ${id}\`` → ví dụ `"Student 522h0001"`

→ Nếu chạy cả 2 (theo bất kỳ thứ tự nào), `fullName` của 10 student đầu sẽ là giá trị của script chạy **sau cùng** — không gây lỗi kỹ thuật, nhưng là 1 điểm lệch dữ liệu thật giữa 2 nguồn seed nếu gộp mà không thống nhất field này trước. Tương tự, `seed.ts` tạo **10 lecturer**, còn `seed-accounts-only.ts` chỉ tạo **1 lecturer** (`lecturer01`) — không xung đột (chỉ là thiếu, không đè lẫn nhau) nhưng cần quyết định roster lecturer cuối cùng là 1 hay 10 khi gộp.

### 4.6. Một comment trong `seed-topic-similarity-demo.ts` không khớp với schema/DB thực tế hiện tại (không phải lỗi chức năng, chỉ là tài liệu sai)

- Dòng 43-44: "*Lưu ý: DB thực tế có unique index TOÀN CỤC trên `code` (ngoài composite [courseId, code] trong schema)*".
- Kiểm tra `prisma/schema.prisma:466`: chỉ có `@@unique([courseId, code])`.
- Kiểm tra migration (`grep -rn unique prisma/migrations/*/migration.sql`): chỉ có `UNIQUE KEY topics_courseId_code_key (courseId, code)`.
- Kiểm tra trực tiếp DB local (`SHOW INDEX FROM topics;`): chỉ có `PRIMARY`, `topics_courseId_code_key (courseId, code)`, `topics_courseId_idx (courseId)` — **không có unique index toàn cục trên `code`**.
- Vậy prefix `"TDB-"` trong file này là phòng hộ dựa trên tiền đề sai, nhưng vô hại (không gây lỗi vì code vẫn duy nhất, chỉ hơi thừa). Nêu ra để anh biết khi review, không phải bug cần sửa gấp.

## 5. Không phát hiện xung đột nào ở các mục sau (đã kiểm tra, an toàn)

- **Course code**: `SEED-101`, `ANALYTICS-2026`, `MONITOR-2026`, `DUPLICATE-2026`, `QHIST-2026`, `TOPIC-DEMO-DB` — không trùng nhau.
- **Topic code** trong 5 script mới: `ANALYTICS-2026-QB`, `MONITOR-2026-QB`, `DUP-2026-QB`, `QHIST-2026-QB`, `TDB-*` (12 mã) — không trùng nhau và đều theo composite `(courseId, code)`.
- **Unique constraint bài làm** (`examId_studentId_attemptNo`, `submissionId_questionId`, ...): mỗi script tự tạo `examId` riêng của course mình, không có script nào tham chiếu chéo `examId` của script khác → không đụng độ.
- Tất cả 5 script mới trong "BIG SEED DATA" đều **idempotent** (dùng `upsert` hoặc kiểm tra tồn tại trước khi tạo), có thể chạy lại nhiều lần an toàn — riêng `seed-cls001-grade1-math.ts` (legacy) là ngoại lệ: nó xoá rồi tạo lại câu hỏi `[DEMO-CLS001]` mỗi lần chạy.

## 6. Trả lời trực tiếp câu hỏi của anh

**"db:rebuild có seed gì, đổi DB gì không?"** → Chỉ xoá sạch DB (`--force-reset`) rồi seed đúng 1 admin + 10 lecturer + 10 student + 1 course + 7 câu hỏi (`seed.ts`). Không đụng gì khác.

**"Có lệch dữ liệu giữa các seed không?"** → Có, cụ thể:
1. `seed-course-question-banks.ts` và `seed-cls001-grade1-math.ts` phụ thuộc course `CLS001..CLS010`/`DATNUO-LECT-01/02` **không còn được tạo bởi bất kỳ script nào** → sẽ crash nếu gộp chạy trên DB mới, trừ khi được sửa lại hoặc loại khỏi seed tổng.
2. `seed-question-history-demo.ts` cần tối thiểu 18 student, `seed-analytics-ui-demo.ts`/`seed-monitor-ui-demo.ts` cần đủ 36 student để tín hiệu demo đúng như thiết kế — nhưng `seed.ts` (chạy bởi `db:rebuild`) chỉ tạo 10. Phải chạy `seed-accounts-only.ts` (36 student) trước các script này.
3. `fullName` của 10 student đầu bị lệch giữa `seed.ts` (`"522h0001"`) và `seed-accounts-only.ts` (`"Student 522h0001"`); số lượng lecturer cũng lệch (10 vs 1).

## 7. Đề xuất hướng gộp (đã được duyệt và triển khai — xem mục 8)

1. ~~Bỏ `seed-course-question-banks.ts` và `seed-cls001-grade1-math.ts` ra khỏi seed tổng~~ → **Đã huỷ đề xuất này theo yêu cầu.** Thay vào đó đã viết lại phần tạo course `CLS001..010`/`DATNUO-LECT-01/02` (file mới `seed-legacy-course-sections.ts`), phục hồi từ code gốc trong lịch sử git.
2. Thứ tự chạy khi gộp: `seed-accounts-only.ts` → `seed.ts` → `seed-legacy-course-sections.ts` → `seed-course-question-banks.ts` → `seed-cls001-grade1-math.ts` → `seed-duplicate-demo.ts` → `seed-topic-similarity-demo.ts` → `seed-question-history-demo.ts` → `seed-analytics-ui-demo.ts` → `seed-monitor-ui-demo.ts`.
3. `seed.ts` (10 lecturer, 10 student, course SEED-101 + 7 câu hỏi) **giữ nguyên không đổi**, chạy sau `seed-accounts-only.ts` nên `fullName` của 10 student đầu và số lecturer theo đúng bản gốc của `seed.ts` (đây là lựa chọn được xác nhận: giữ "seed cũ user + 7 câu hỏi" làm chuẩn).
4. Đã đổi `"db:rebuild"` trong `package.json` để trỏ sang seed tổng (`npm run seed:all` → `prisma/seed-master.ts`) thay vì `prisma/seed.ts`. `scripts/db-rebuild.sh` (dùng cho production/EC2) cũng đã cập nhật tương ứng.

## 8. Đã triển khai (2026-08-16)

### 8.1. File mới: `prisma/seed-legacy-course-sections.ts`
Phục hồi nguyên trạng phần tạo course bị gỡ khỏi `seed.ts` trước v1.0.0, lấy từ `git show 95cd9cea:BE/prisma/seed.ts` (commit đã thêm các lớp học phần này trước khi bị thay thế ở `71d6c3d5`):
- Course `CLS001` ("Khóa học thử nghiệm Academic Trust", academicYear 2025-2026, TERM_2, gán `lecturer01`, enroll toàn bộ student hiện có).
- 11 lớp học phần: `DATNUO-LECT-01/02`, `CLS002`..`CLS010`, mỗi lớp enroll 20 sinh viên (cyclic theo danh sách student hiện có) — giữ đúng tên/mã/credits/idempotent-upsert như bản gốc.
- Đây là điều kiện tiên quyết bắt buộc cho `seed-course-question-banks.ts` và `seed-cls001-grade1-math.ts`.

### 8.2. File mới: `prisma/seed-master.ts`
Orchestrator gọi tuần tự `main()` của 10 script theo đúng thứ tự phụ thuộc (xem comment đầu file để biết lý do từng bước). Idempotent toàn bộ (trừ bước Toán lớp 1, vốn xoá/tạo lại theo đúng thiết kế gốc).

### 8.3. Sửa 8 file hiện có để export `main` thay vì tự chạy khi import
`seed-accounts-only.ts`, `seed-analytics-ui-demo.ts`, `seed-monitor-ui-demo.ts`, `seed-duplicate-demo.ts`, `seed-topic-similarity-demo.ts`, `seed-question-history-demo.ts`, `seed-course-question-banks.ts`, `seed-cls001-grade1-math.ts`: mỗi file được bọc `try { ... } finally { await prisma.$disconnect(); }` trong `main()`, export `main`, và chỉ tự chạy khi được gọi trực tiếp (`process.argv[1].includes('<tên file>.ts')`) — theo đúng pattern đã có sẵn trong `seed.ts`. Hành vi chạy độc lập (`npx ts-node --transpile-only prisma/<file>.ts`) **không đổi**.

### 8.4. Bug thật phát hiện khi chạy thử (không phải suy đoán): `seed-cls001-grade1-math.ts:158`
Dòng gốc `prisma.topic.upsert({ where: { code: topic.code }, ... })` — không hợp lệ với schema hiện tại (`Topic` chỉ có unique composite `(courseId, code)`, không có unique trên `code` đơn lẻ). Chạy thử ra lỗi `PrismaClientValidationError` thật (không phải phỏng đoán tĩnh). Đã sửa thành `where: { courseId_code: { courseId: course.id, code: topic.code } }`, thêm `courseId` vào `create`.

### 8.5. Cập nhật `package.json`
- `db:rebuild` → `prisma db push --force-reset ... && npm run seed:all` (trước đây là `npm run seed`).
- Thêm `seed:all` (chạy `seed-master.ts`), `seed:accounts` (chạy `seed-accounts-only.ts`), `seed:legacy-course-sections` (chạy `seed-legacy-course-sections.ts`).
- `seed` (chạy riêng `seed.ts`) vẫn giữ nguyên để dùng khi chỉ cần seed tối thiểu.

### 8.6. Cập nhật `scripts/db-rebuild.sh`
Đổi lệnh seed cuối từ `prisma/seed.ts` sang `prisma/seed-master.ts`, dùng cho quy trình rebuild DB trên EC2/production.

### 8.7. Đã kiểm thử thực tế trên DB local (`examtrust`)
Chạy `npx ts-node --transpile-only prisma/seed-master.ts` **2 lần liên tiếp** trên DB local (không dùng `--force-reset`, vì đó là hành động phá huỷ dữ liệu — cần anh xác nhận trước khi tôi làm trên máy anh):
- Lần 1: phát hiện và sửa bug ở mục 8.4.
- Lần 2 (sau khi sửa): cả 10 bước chạy thành công, không lỗi. Kết quả xác nhận đúng thiết kế:
  - `seed-analytics-ui-demo`: 36 bài làm, đủ 4 tín hiệu (fast HIGH ở index 30, fast REVIEW ở index 31, cặp collusion ở index 34 & 35).
  - `seed-monitor-ui-demo`: 33 phiên làm bài, 8 evidence, 25 integrity log — đúng số lượng thiết kế.
  - `seed-course-question-banks`: 1200 câu hỏi cho 12 lớp (đủ 100 câu/lớp).
  - `seed-cls001-grade1-math`: 60 câu hỏi (5 topic × 12 câu) cho CLS001.
- Chạy lại lần 2 xác nhận **idempotent**: không tạo trùng dữ liệu, các bước `upsert`/kiểm tra tồn tại hoạt động đúng.

### 8.8. Đã test `npm run db:rebuild` thật (full `--force-reset`, đúng y hệt luồng production)

Sau khi anh xác nhận, đã chạy `npm run db:rebuild` thật (Prisma yêu cầu xác nhận rõ ràng cho thao tác phá huỷ dữ liệu này — đã nêu rõ hành động/hậu quả/dev vs prod trước khi chạy). Kết quả: **reset DB rỗng hoàn toàn → seed lại từ đầu → 10 bước pass, không lỗi.**

Đối chiếu số liệu cuối cùng trực tiếp trong MySQL sau khi chạy xong:
```
users:      1 ADMIN, 10 LECTURER, 36 STUDENT
courses:    18 (SEED-101, CLS001..CLS010, DATNUO-LECT-01/02,
                ANALYTICS-2026, MONITOR-2026, DUPLICATE-2026,
                QHIST-2026, TOPIC-DEMO-DB)
questions:  1318  (= 7 SEED-101 + 1200 course-question-banks + 60 CLS001-grade1-math
                    + 16 analytics-ui-demo + 10 monitor-ui-demo + 15 duplicate-demo
                    + 10 question-history-demo)
```
Khớp chính xác với thiết kế của từng script — xác nhận `npm run db:rebuild` (và `scripts/db-rebuild.sh` cho production) giờ tạo ra đúng "DB chuẩn gốc" như mong muốn.

Ghi chú phụ (không liên quan seed): trong lúc `prisma db push --force-reset` tự chạy `prisma generate`, có 1 lỗi `EPERM` khi ghi đè `query_engine-windows.dll.node` (do file đang bị khoá bởi tiến trình Node khác đang chạy, ví dụ dev server). Không ảnh hưởng tới seed vì Prisma Client đã sinh trước đó vẫn dùng được — nhưng nếu anh gặp lỗi tương tự, hãy tắt các tiến trình `node`/`nest start --watch` trước khi chạy `db:rebuild` để `generate` sạch hoàn toàn.
