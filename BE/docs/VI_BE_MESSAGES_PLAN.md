# Kế hoạch Việt hóa thông báo Backend (BE)

> Phạm vi: chỉ chuỗi text mà người dùng cuối có thể nhìn thấy — exception message trả về FE (hiển thị qua toast/dialog), message trong response thành công, message validate DTO (class-validator), nội dung email gửi cho người dùng. Code/biến/hàm/log nội bộ (`logger.log`, `console.log`, comment) giữ nguyên tiếng Anh — không dịch.
> Tiếp theo sau khi FE đã hoàn tất (xem `FE/docs/VI_UI_REFACTOR_PLAN.md`) — dùng lại đúng bảng Glossary đã chốt ở đó để nhất quán thuật ngữ giữa BE và FE (vì exception message BE thường hiển thị trực tiếp trong toast FE).
> Nguồn khảo sát: agent khảo sát toàn bộ `BE/src` ngày 2026-08-06, ước tính ~291 chuỗi tiếng Anh hướng người dùng, cộng 6 chuỗi tiếng Việt đã có rải rác (tình trạng lẫn ngôn ngữ trong cùng file — giống lỗi đã gặp ở FE Part 3).

## Rủi ro quan trọng cần lưu ý trước khi sửa

**Cập nhật sau khi rà soát chi tiết ở Part 0 (2026-08-06):** rủi ro hẹp hơn ước tính ban đầu. Đã kiểm tra cách assert của cả 11 file spec dùng `toThrow`/`rejects`:

- **9/11 file chỉ assert vào LOẠI exception** (`rejects.toBeInstanceOf(NotFoundException)`, `toThrow(BadRequestException)`...), KHÔNG kiểm tra nội dung text → **an toàn khi đổi message**, không cần sửa spec:
  `exam-quality-review.service.spec.ts`, `exams.snapshot.spec.ts`, `questions-v2.duplicates.spec.ts`, `access-policy.service.spec.ts`, `exam-risk-assessment.service.spec.ts`, `submissions.find-error.spec.ts`, `submissions.snapshot-score.spec.ts` (không dùng pattern này thực ra, xem ghi chú), `ai-generation.processor.spec.ts`, `ai-generation.risk-assessment.processor.spec.ts` (2 file này mock lỗi bằng text riêng của test, không lấy từ code thật của `ai.service.ts`, nên đổi message thật không ảnh hưởng).
- **2/11 file thực sự assert vào text cụ thể, LÀ RỦI RO THẬT:**
  `ai.service.spec.ts` (dòng 100, 115, 133) và `ai.service.risk-assessment.spec.ts` (dòng 152, 161, 170) — cả 6 chỗ đều assert `rejects.toThrow('AI generation failed')`, khớp với chuỗi thật `throw new Error(`AI generation failed: ${error.message}`)` xuất hiện 5 lần trong `ai.service.ts` (dòng 353, 511, 710, 869, 1048).
  → Đây đúng là nhóm message kỹ thuật nội bộ mà Part 8 dự kiến **giữ nguyên tiếng Anh** (không hiển thị trực tiếp cho người dùng cuối), nên nhiều khả năng sẽ không cần sửa. Nếu Part 8 quyết định dịch phần này thì bắt buộc phải sửa cả 6 dòng assert kèm theo.

→ **Quy tắc áp dụng còn lại**: trước khi đổi bất kỳ message nào ở Part 1–7, vẫn grep nhanh `*.spec.ts` của đúng module đó để chắc chắn không có assert text mới xuất hiện ngoài danh sách trên, nhưng theo khảo sát Part 0 thì Part 1–7 (submissions, exams, questions-v2, exam-links, auth, courses, common, enrollments, users, admin-dashboard) **không có rủi ro assert-text nào** — chỉ Part 8 (ai) cần cẩn trọng.

## Quy tắc chung (kế thừa từ FE, áp dụng thêm cho BE)

- Dùng lại bảng Glossary đã chốt ở FE Part 0 cho các thuật ngữ trùng (Đăng nhập, Kiểm tra hợp lệ/validate, Xác nhận/confirm, Dễ/Trung bình/Khó...).
- Message lỗi kỹ thuật thuần backend không bao giờ hiển thị cho người dùng (ví dụ lỗi parse response AI nội bộ, lỗi queue/redis) → **không dịch**, giữ tiếng Anh cho dev dễ tra log. Chỉ dịch message có khả năng trả thẳng ra FE (qua `HttpException.message`) mà người dùng cuối đọc được.
- Khi 1 exception đã có sẵn message tiếng Việt đúng chuẩn (6 chuỗi phát hiện được) — giữ nguyên, dùng làm mẫu văn phong cho các message cùng nhóm nghiệp vụ trong file đó.
- Message ngắn, rõ nghĩa, không lặp chi tiết kỹ thuật (id, stack) trong bản dịch trừ khi bản gốc tiếng Anh đã có.

## Quy trình làm việc

1. Chỉ chạy 1 Part khi được yêu cầu rõ ràng ("Chạy Part X").
2. Trước khi sửa 1 service, grep các spec file liên quan xem có assert vào message sắp đổi không; ghi chú lại danh sách.
3. Sửa message trong service/controller/DTO, đồng thời sửa spec assert tương ứng trong cùng lượt.
4. Sau khi sửa xong 1 Part: chạy `npm run build` (tsc qua nest build) để đảm bảo không lỗi kiểu, và chạy test của đúng module đó (`npx jest <module>`).
5. **Kiểm duyệt có bằng chứng**: liệt kê file đã sửa, số message đã dịch, danh sách spec đã cập nhật kèm, kết quả grep xác nhận không còn sót message tiếng Anh hướng người dùng trong module đó (chấp nhận sót message kỹ thuật nội bộ, ghi rõ lý do giữ nguyên).
6. Đánh dấu `[x]` cho Part trong file này kèm ngày hoàn thành.
7. Part cuối (Part 9) chạy toàn bộ `npm run build` + `npm run test` để xác nhận không phá vỡ gì.

---

## Part 0 — Chuẩn bị & rà soát chuỗi tiếng Việt hiện có (không sửa code)

Trạng thái: [x] Hoàn thành 2026-08-06

### Kiểm duyệt Part 0

**Đã xác nhận lại 6 message tiếng Việt vẫn đúng vị trí (`sed -n` trực tiếp trên file):**
- `auth.controller.ts:58` — `'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau.'`
- `courses.service.ts:292` — `'Không thể lưu trữ khóa học khi đang có bài thi hoặc lượt làm bài đang diễn ra.'`
- `exams.service.ts:913` — `'Bài thi đã có dữ liệu làm bài và không thể xóa. Hãy lưu trữ bài thi thay thế.'`
- `exams.service.ts:924` — `'Không thể lưu trữ bài thi khi đang có lượt làm bài diễn ra.'`
- `exam-risk-assessment.service.ts:48` — `'Không tìm thấy lượt làm bài của sinh viên.'`
- `exam-risk-assessment.service.ts:183` — `'Không tìm thấy kết quả đánh giá rủi ro.'`

**Đã rà soát chi tiết cách assert của toàn bộ 11 file spec dùng `toThrow`/`rejects`** (thay cho phần ước tính sơ bộ trước đây) — xem kết quả và kết luận đầy đủ ở mục "Rủi ro quan trọng" phía trên đã được cập nhật. Tóm tắt: chỉ 2 file (`ai.service.spec.ts`, `ai.service.risk-assessment.spec.ts`, tổng 6 dòng assert) thực sự phụ thuộc vào nội dung text `'AI generation failed'`; 9 file còn lại chỉ assert loại exception hoặc dùng text tự mock, không phụ thuộc message thật trong code → an toàn khi dịch ở Part 1–7.

---

## Part 1 — submissions (ưu tiên cao nhất, ~88 message)

Trạng thái: [x] Hoàn thành 2026-08-06 — xem kiểm duyệt bên dưới

File liên quan:
- `BE/src/submissions/submissions.service.ts` — validate trạng thái bài thi, webcam/consent, autosave, chấm điểm (ví dụ dòng 406, 429, 1233)
- `BE/src/submissions/exam-risk-assessment.service.ts` — đã có 2 message tiếng Việt sẵn (dòng 48, 183), phần còn lại kiểm tra riêng
- Spec cần rà soát trước khi sửa: `submissions.find-error.spec.ts`, `submissions.snapshot-score.spec.ts`, `exam-risk-assessment.service.spec.ts`

### Kiểm duyệt Part 1 (2026-08-06)

**Phát hiện thêm ngoài khảo sát ban đầu:** module `submissions` còn có `BE/src/submissions/proctoring-evidence.service.ts` (16 message tiếng Anh, quản lý bằng chứng webcam) và `BE/src/submissions/submissions.controller.ts` (3 message tiếng Anh, luồng SSE theo dõi thời gian thực) — cả 2 file không được liệt kê rõ trong bảng khảo sát ban đầu nhưng thuộc module này, đã dịch cùng lượt.

**Đã sửa — `submissions.service.ts`** (60 message dịch, xác nhận qua grep cuối không còn chuỗi Anh nào khớp `throw new (...)Exception('[A-Za-z]`): toàn bộ exception liên quan validate trạng thái bài thi (chưa bắt đầu/đã kết thúc/không khả dụng), yêu cầu webcam & thiết bị, autosave, giới hạn log, snapshot đề thi/lượt làm bài, điều chỉnh điểm & hủy điều chỉnh, chấm tự luận, quyền xem timeline/truy cập bài làm, giới hạn số lần làm bài. Ví dụ: `'Exam has ended'` → `'Bài thi đã kết thúc'`, `'A revocation reason is required'` → `'Cần nhập lý do khi hủy điều chỉnh điểm'`.
- **Sự cố trong lúc sửa:** một số message trùng lặp y hệt xuất hiện nhiều lần với indentation khác nhau (`'Submission not found'` ở cả 6/8/10 khoảng trắng thụt lề) khiến 2 lượt `replace_all` báo lỗi "found 2 matches" và 1 lượt bị gõ nhầm thành text placeholder `"(đã dịch)"`. Đã phát hiện ngay qua grep xác nhận sau mỗi batch và sửa lại đúng — không có message nào bị bỏ sót hoặc sai trong bản cuối (đã grep lại toàn file để xác nhận).

**Đã sửa — `proctoring-evidence.service.ts`** (16 message): toàn bộ luồng yêu cầu/xác nhận chụp webcam theo lịch hoặc theo sự kiện nghi vấn, giới hạn/thời gian chờ, xác thực nonce, định dạng & kích thước ảnh, quyền xem bằng chứng của giảng viên.

**Đã sửa — `submissions.controller.ts`** (3 message): thiếu/không hợp lệ token truy cập SSE, chỉ giảng viên/quản trị viên được theo dõi sự kiện thời gian thực.

**Đã sửa — `exam-risk-assessment.service.ts`** (2 message còn lại, 2 message khác đã có sẵn tiếng Việt từ trước không đổi): `'Exam not found'` → `'Không tìm thấy bài thi'`, `'Anomaly flag not found'` → `'Không tìm thấy cảnh báo bất thường'`.

**Kiểm tra grep còn sót:** `grep -rn "throw new (BadRequestException|NotFoundException|ForbiddenException|UnauthorizedException|ConflictException|Error)\(['\"\`][A-Za-z]" BE/src/submissions` → không còn kết quả tiếng Anh nào.

**Kiểm tra biên dịch:** `npm run build` (nest build) → sạch, không lỗi.

**Kiểm tra test:** `npx jest submissions` → `3 suites passed, 15 tests passed` — đúng như dự đoán ở Part 0, không có spec nào assert vào nội dung text nên không cần sửa file spec nào.

---

## Part 2 — exams (~55 message, đang lẫn ngôn ngữ)

Trạng thái: [x] Hoàn thành 2026-08-06 — xem kiểm duyệt bên dưới

File liên quan:
- `BE/src/exams/exams.service.ts` — đã có 2 message tiếng Việt (dòng 913, 924) dùng làm mẫu; phần còn tiếng Anh ví dụ dòng 331 "Course not found", 783, 847
- Spec cần rà soát: `exams.snapshot.spec.ts`, `exam-quality-review.service.spec.ts`

### Kiểm duyệt Part 2 (2026-08-06)

**Rà soát spec trước khi sửa:** `grep "toBeInstanceOf\|toThrow("` trên cả 2 file spec → **không có kết quả nào** (không dùng pattern assert này ở các luồng liên quan tới message vừa đổi) → an toàn tuyệt đối, không cần sửa spec kèm theo, đúng như Part 0 đã dự đoán.

**Đã sửa — `BE/src/exams/exams.service.ts`** (49 vị trí throw exception + 2 message thành công, tổng 51 chuỗi dịch sang tiếng Việt):
- Các message lặp lại giống nhau ở nhiều nơi, dùng `replace_all` một lượt để đồng bộ: `'Exam not found'` → `'Không tìm thấy bài thi'` (8 vị trí: dòng 703,728,779,839,909,921,933,947,1024,1052,1096,1371 — tổng 12 lần xuất hiện thực tế), `'You are not enrolled in this course'` → `'Bạn chưa đăng ký khóa học này'` (2 vị trí: 741, 1272), `'Questions can only be changed while the exam is a draft'` → `'Chỉ có thể thay đổi câu hỏi khi bài thi ở trạng thái bản nháp'` (3 vị trí: 950,1026,1054), `'Question not found in exam'` → `'Không tìm thấy câu hỏi trong bài thi'` (2 vị trí: 1036,1064), `'Cannot publish exam without questions'` → `'Không thể công bố bài thi khi chưa có câu hỏi'` (2 vị trí: 1104,1120), `` `Missing version for question ${id}` `` → `` `Thiếu phiên bản cho câu hỏi ${id}` `` (2 vị trí: 1151,1162).
- Các message riêng lẻ dịch từng vị trí: "Course not found"→"Không tìm thấy khóa học" (331), "You are not allowed to create exams for this course"→"Bạn không có quyền tạo bài thi cho khóa học này" (335), "Question not found: {id}"→"Không tìm thấy câu hỏi: {id}" (401), 2 message snapshot thiếu nội dung/đáp án (193,197), 3 message phân bổ câu hỏi theo chủ đề/ngân hàng câu hỏi (463-465, 500-502, 525-527, 534-536), 3 message "Exam is not available/has not started/has ended" (748,753,756), "Use the dedicated publish, archive, or restore action..."→"Vui lòng dùng hành động công bố, lưu trữ hoặc khôi phục riêng..." (783), "Only draft exams can be edited..."→"Chỉ có thể sửa bài thi ở trạng thái bản nháp..." (787), 6 message reschedule (843,847,851,855,862,866,871-873), "Exam is already archived"→"Bài thi đã được lưu trữ" (922), "Exam is not archived"→"Bài thi chưa được lưu trữ" (934), "Only draft exams can be published"→"Chỉ có thể công bố bài thi ở trạng thái bản nháp" (1100).
- 2 message thành công trả về FE: dòng 916 `{ message: 'Draft exam deleted successfully' }` → `{ message: 'Đã xóa bản nháp bài thi thành công' }`; dòng 1043 `{ message: 'Question removed from exam' }` → `{ message: 'Đã xóa câu hỏi khỏi bài thi' }`.
- 2 message tiếng Việt có sẵn (913, 924) giữ nguyên, dùng làm mẫu văn phong.
- Thuật ngữ dùng nhất quán với Glossary FE: "Bài thi" (Exam), "Khóa học" (Course), "Câu hỏi" (Question), "Bản nháp" (Draft) — khớp với `status-badge.tsx` domain `exam`/`course` ở FE.

**Kiểm tra grep còn sót:** `grep -nE "throw new (BadRequest|NotFound|Forbidden|Unauthorized|Conflict|Internal)Exception\(|message: '"` trên `exams.service.ts` → toàn bộ 51 kết quả đều đã là tiếng Việt, không còn message tiếng Anh nào.

**Kiểm tra biên dịch & test:**
- `npm run build` (nest build) → sạch, không lỗi kiểu.
- `npx jest exams` → `exam-quality-review.service.spec.ts` PASS (5/5, không liên quan tới `exams.service.ts` nên không bị ảnh hưởng); `exams.snapshot.spec.ts` **FAIL nhưng KHÔNG do sửa đổi của Part này** — lỗi `TS2554: Expected 2 arguments, but got 3` tại dòng gọi `new ExamsService(prisma, ..., {} as any)` trong spec (constructor hiện chỉ nhận 2 tham số). Xác nhận bằng `git diff --stat` cho `exams.snapshot.spec.ts` → **0 dòng thay đổi** (file này chưa từng bị Part 2 chỉnh sửa) và lỗi là mismatch số lượng tham số constructor, không liên quan gì đến nội dung message/chuỗi text. Đây là lỗi test có từ trước, ngoài phạm vi Part 2 (dịch message), cần một task riêng để sửa signature test không khớp code.

---

## Part 3 — questions-v2 (~56 message)

Trạng thái: [x] Hoàn thành 2026-08-06 — xem kiểm duyệt bên dưới

File liên quan:
- `BE/src/questions-v2/questions-v2.service.ts` — quyền truy cập câu hỏi, đề xuất cải thiện AI, xung đột bản nháp (ví dụ dòng 244, 646, 769)
- Spec cần rà soát: `questions-v2.duplicates.spec.ts`

### Kiểm duyệt Part 3 (2026-08-06)

**Đã sửa — `questions-v2.service.ts`** (57 message dịch, xác nhận qua grep cuối không còn chuỗi Anh nào khớp `throw new (...)Exception('[A-Za-z]` hay `message: '[A-Za-z]`): toàn bộ exception CRUD câu hỏi/chủ đề/khóa học, quyền truy cập & sao chép câu hỏi, luồng đề xuất cải thiện AI (tạo/sửa/duyệt/từ chối, xung đột khi câu hỏi bị sửa sau khi có đề xuất), bản nháp câu hỏi (xung đột phiên bản khi lưu/công bố, quyền truy cập), tác vụ tạo câu hỏi bằng AI (trạng thái chưa sẵn sàng, không tìm thấy phương án đề xuất), và message validate bản nháp (thiếu nội dung câu hỏi, thiếu phương án/đáp án đúng, thiếu giải thích) — nhóm cuối này là response trả trực tiếp cho FE để hiển thị lỗi validate theo từng field, không phải log nội bộ nên đã dịch. Ví dụ: `'Question was edited after the AI proposal was generated...'` → `'Câu hỏi đã được sửa sau khi đề xuất AI được tạo. Vui lòng so sánh lại hoặc tạo đề xuất mới.'`; `'Draft validation failed'` → `'Bản nháp chưa hợp lệ'`.
- **Sự cố trong lúc sửa:** nhiều message giống nhau (`'Question not found'`, `'AI improvement not found'`, `'Course not found'`, `'courseId is required'`) lặp lại ở nhiều vị trí khác nhau trong file 2077 dòng khiến một số lượt `Edit` không `replace_all` bị lỗi "not found" (do đoạn văn cảnh xung quanh đã đổi từ lượt trước) hoặc "found 2 matches". Đã xử lý bằng cách đọc lại đúng đoạn code quanh từng vị trí còn sót (qua `Read` theo offset) trước khi sửa tiếp, không đoán mò — không có message nào bị bỏ sót trong bản cuối.

**Kiểm tra grep còn sót:** `grep -n "throw new (...)Exception\('[A-Za-z]|message: '[A-Za-z]" BE/src/questions-v2/questions-v2.service.ts` → không còn kết quả tiếng Anh nào. Đã kiểm tra riêng 3 file controller (`ai-generation-jobs.controller.ts`, `question-drafts.controller.ts`, `question-metadata.controller.ts`) — không có exception message nào ở tầng controller (đều gọi qua service), không cần sửa.

**Kiểm tra biên dịch:** `npm run build` (nest build) → sạch, không lỗi.

**Kiểm tra test:** `npx jest questions-v2` → `2 suites passed, 4 tests passed` — đúng như dự đoán ở Part 0, `questions-v2.duplicates.spec.ts` chỉ assert loại exception nên không cần sửa spec.

---

## Part 4 — exam-links (~26 message)

Trạng thái: [x] Hoàn thành 2026-08-06 — xem kiểm duyệt bên dưới

File liên quan:
- `BE/src/exam-links/exam-links.service.ts` — khóa liên kết do sai mật khẩu nhiều lần, yêu cầu đăng nhập, điều kiện tham gia (dòng 136, 162, 174)
- Chưa phát hiện spec assert message riêng cho module này — vẫn cần grep lại khi thực thi để chắc chắn.

### Kiểm duyệt Part 4 (2026-08-06)

**Rà soát spec trước khi sửa:** `grep -rl "ExamLinksService" --include="*.spec.ts"` và tìm file `*exam-link*.spec.ts` → **không có kết quả nào** — xác nhận đúng như ghi chú ban đầu, module này không có spec riêng, an toàn tuyệt đối khi đổi message.

**Đã sửa — `BE/src/exam-links/exam-links.service.ts`** (26 message dịch, đúng số lượng ước tính ban đầu): kiểm tra bằng `controller.ts` xác nhận không có message nào ở tầng controller (chỉ gọi qua service), DTO (`exam-link.dto.ts`) chỉ dùng validator không tùy biến message nên nằm ngoài phạm vi Part 4 theo đúng file liên quan đã ghi.
- Message lặp giống nhau ở nhiều nơi, dùng `replace_all` một lượt: `'Link has been revoked'` → `'Liên kết đã bị thu hồi'` (3 vị trí: 132,184,243), `'Link is temporarily locked due to multiple failed password attempts'` → `'Liên kết bị tạm khóa do nhập sai mật khẩu nhiều lần'` (2 vị trí: 136,188), `'Link expired or no longer valid'` → `'Liên kết đã hết hạn hoặc không còn hiệu lực'` (6 vị trí: 140,144,192,196,247,251), `'Invalid exam link'` → `'Liên kết bài thi không hợp lệ'` (2 vị trí: 124,239), `'Exam link not found'` → `'Không tìm thấy liên kết bài thi'` (2 vị trí: 322,361), `'Exam is not available'`/`'Exam has not started yet'`/`'Exam has ended'` → 3 message trạng thái bài thi (dùng đúng bản dịch đã chốt ở Part 2 `exams.service.ts` để nhất quán xuyên module), `'Please login to continue'` → `'Vui lòng đăng nhập để tiếp tục'` (theo glossary FE: authenticate = "Đăng nhập"), `'You are not eligible for this exam link'` → `'Bạn không đủ điều kiện dùng liên kết bài thi này'`, `'Password is required or incorrect'` → `'Cần nhập mật khẩu hoặc mật khẩu không đúng'`.
- Message riêng lẻ: "Exam not found"→"Không tìm thấy bài thi" (42), "You do not have permission to manage links for this exam"→"Bạn không có quyền quản lý liên kết cho bài thi này" (46), "Expiry datetime must be in the future"→"Thời gian hết hạn phải ở trong tương lai" (60), "You do not have permission to update this link"→"Bạn không có quyền cập nhật liên kết này" (326), "You do not have permission to view this link usage"→"Bạn không có quyền xem lượt sử dụng của liên kết này" (365).
- Thuật ngữ nhất quán với Part 2 (Bài thi/Liên kết) và Glossary FE (Đăng nhập).

**Kiểm tra grep còn sót:** `grep -nE "throw new (BadRequest|NotFound|Forbidden|Unauthorized|Conflict|Gone|Internal)Exception\("` trên `exam-links.service.ts` → toàn bộ 26 kết quả đều đã là tiếng Việt.

**Kiểm tra biên dịch & test:**
- `npm run build` (nest build) → sạch, không lỗi kiểu.
- `npx jest exam-links` → `No tests found` (0 test suite khớp pattern) — xác nhận đúng như đã grep trước khi sửa, không có spec nào cho module này nên không có rủi ro assert-text.

---

## Part 5 — auth (~22 message + DTO, đang lẫn ngôn ngữ)

Trạng thái: [x] Hoàn thành 2026-08-06 — xem kiểm duyệt bên dưới

File liên quan:
- `BE/src/auth/auth.service.ts` — "Invalid credentials", "Account is not active", "Password updated successfully..." (dòng 85, 89, 264)
- `BE/src/auth/auth.controller.ts` — đã có message tiếng Việt rate-limit (dòng 58) dùng làm mẫu
- `BE/src/auth/dto/*.dto.ts` — LoginDto/RegisterDto/UpdateProfileDto dùng message mặc định của class-validator (không có `message:` tùy biến) → cần thêm message tiếng Việt tường minh cho các decorator chính (`@IsEmail`, `@MinLength`, `@IsNotEmpty`) vì mặc định class-validator trả tiếng Anh.
- Không có spec assert message auth theo khảo sát ban đầu — vẫn cần grep lại.

### Kiểm duyệt Part 5 (2026-08-06)

**Xác nhận không có file spec nào trong module auth** (`ls src/auth/*.spec.ts` → không có kết quả) — đúng như khảo sát ban đầu, không có rủi ro test.

**Đã sửa — `auth.service.ts`** (18 message): sai thông tin đăng nhập, tài khoản chưa kích hoạt, đăng ký công khai chỉ tạo tài khoản sinh viên, email đã tồn tại, không tìm thấy người dùng/tài khoản không hoạt động (lặp lại ở nhiều luồng: getProfile/updateProfile/changePassword/deleteProfile/rotateSession), sai mật khẩu hiện tại, mật khẩu mới phải khác mật khẩu cũ, refresh token không hợp lệ/hết hạn, không tìm thấy phiên đăng nhập, và các message thành công (đổi mật khẩu, xóa hồ sơ, đăng xuất, hủy phiên).

**Đã sửa — `auth.controller.ts`** (2 message): thiếu refresh token, đăng xuất thành công. Message rate-limit ở dòng 58 đã có sẵn tiếng Việt từ Part 0, giữ nguyên làm mẫu.

**Đã sửa — `jwt.strategy.ts`** (2 message): không tìm thấy người dùng/tài khoản không hoạt động, phiên hết hạn do đổi mật khẩu.

**Đã sửa — DTO validate** (`login.dto.ts`, `register.dto.ts`, `update-profile.dto.ts`): thêm `message:` tiếng Việt tường minh cho toàn bộ decorator `@IsEmail`, `@IsString`, `@MinLength`, `@IsEnum` (trước đó dùng mặc định class-validator nên lỗi validate trả về tiếng Anh như "email must be an email"). Ví dụ: `@IsEmail()` → `@IsEmail({}, { message: 'Email không hợp lệ' })`, `@MinLength(6)` → `@MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })`.

**Đã kiểm tra, không sửa:** `BE/src/auth/auth.module.ts:19` — `throw new Error('JWT_SECRET must be set in the environment. Refusing to start.')` là lỗi cấu hình khi khởi động server (crash trước khi phục vụ request nào), không hiển thị cho người dùng cuối → giữ tiếng Anh theo đúng quy tắc "message kỹ thuật nội bộ không dịch". `BE/src/auth/guards/*.ts` — không có exception message nào, không cần sửa.

**Kiểm tra grep còn sót:** `grep -rn "throw new (...)Exception\('[A-Za-z]|message: '[A-Za-z]" BE/src/auth` → chỉ còn đúng 1 kết quả kỹ thuật nội bộ đã ghi nhận ở trên (`auth.module.ts:19`), không còn message hướng người dùng nào bằng tiếng Anh.

**Kiểm tra biên dịch:** `npm run build` (nest build) → sạch, không lỗi.

**Kiểm tra test:** không có spec module auth để chạy — đúng như dự đoán ở Part 0.

---

## Part 6 — courses + common (access-policy) (~25 message, courses đang lẫn ngôn ngữ)

Trạng thái: [x] Hoàn thành 2026-08-06 — xem kiểm duyệt bên dưới

File liên quan:
- `BE/src/courses/courses.service.ts` — đã có message tiếng Việt (dòng 292) dùng làm mẫu; còn lại tiếng Anh ví dụ dòng 25, 271
- `BE/src/courses/dto/create-course.dto.ts` — message format academicYear (dòng 19)
- `BE/src/common/services/access-policy.service.ts` — kiểm tra quyền truy cập chung, dùng ở nhiều module khác nên cần cẩn trọng khi đổi text (ảnh hưởng nhiều luồng)
- `BE/src/common/guards/rate-limit.guard.ts` — message rate limit có nội dung kỹ thuật (`retryAfter=...ms`) — xem xét format lại khi dịch để vẫn hiển thị số giây chờ dễ hiểu
- Spec cần rà soát: `access-policy.service.spec.ts`

### Kiểm duyệt Part 6 (2026-08-06)

**Rà soát spec trước khi sửa:** `access-policy.service.spec.ts` chỉ dùng `rejects.toBeInstanceOf(ForbiddenException|NotFoundException)`, không assert nội dung text → an toàn, không cần sửa spec. Không có spec riêng cho `courses.service.ts`.

**Đã sửa — `BE/src/courses/courses.service.ts`** (13 message dịch): "Assigned lecturer is invalid or inactive"→"Giảng viên được gán không hợp lệ hoặc không hoạt động"; "You are not allowed to access this course"→"Bạn không có quyền truy cập khóa học này" (3 vị trí, `replace_all`); "Course not found"→"Không tìm thấy khóa học" (5 vị trí — 3 vị trí dạng nhiều dòng và 2 vị trí dạng `if (!course) throw...` một dòng, phải chạy `replace_all` **2 lượt riêng** vì 2 dạng có khoảng trắng/ngữ cảnh khác nhau khiến lượt đầu chỉ khớp 3/5); "Only admin can re-assign course lecturer"→"Chỉ quản trị viên mới có thể gán lại giảng viên cho khóa học"; message thành công `'Course archived successfully'`→`'Đã lưu trữ khóa học thành công'`; "Course is already archived"→"Khóa học đã được lưu trữ"; "Course is not archived"→"Khóa học chưa được lưu trữ". Message tiếng Việt có sẵn (dòng 292) giữ nguyên làm mẫu.
- **Sự cố trong lúc sửa:** lượt `replace_all` đầu tiên cho "Course not found" báo "successfully replaced" nhưng grep xác nhận lại ngay sau đó vẫn còn 2/5 vị trí (dạng `if (!course) throw new NotFoundException('Course not found');` một dòng) chưa đổi — do old_string chỉ khớp đúng các vị trí có định dạng nhiều dòng giống nhau tuyệt đối, không tự động khớp biến thể một dòng. Phát hiện ngay qua grep xác nhận theo quy trình, chạy `replace_all` lần 2 với old_string khác để xử lý hết.

**Đã sửa — `BE/src/courses/dto/create-course.dto.ts`** (1 message): "academicYear must be in YYYY-YYYY format"→"Năm học phải theo định dạng YYYY-YYYY" (decorator `@Matches` cho trường `academicYear`).

**Đã sửa — `BE/src/common/services/access-policy.service.ts`** (8 message): "Exam not found"→"Không tìm thấy bài thi", "You are not allowed to access this exam"→"Bạn không có quyền truy cập bài thi này", "Course not found"→"Không tìm thấy khóa học", "You are not allowed to access this course"→"Bạn không có quyền truy cập khóa học này" (khớp đúng bản dịch dùng ở `courses.service.ts` để nhất quán xuyên module), "Submission not found"→"Không tìm thấy lượt làm bài" (dùng đúng thuật ngữ "lượt làm bài" đã chốt ở Part 1 cho `submission`, thay vì dịch máy móc là "bài nộp"), "You are not allowed to access this submission"→"Bạn không có quyền truy cập lượt làm bài này", "Answer not found"→"Không tìm thấy câu trả lời", "Anomaly flag not found"→"Không tìm thấy cảnh báo bất thường" (khớp đúng bản dịch đã dùng ở `exam-risk-assessment.service.ts` từ Part 1).

**Đã sửa — `BE/src/common/guards/rate-limit.guard.ts`** (3 message, có định dạng lại theo đúng ghi chú của plan): bỏ phần thuật ngữ kỹ thuật `Rate limit: ${policyName} per-user/per-ip/per-exam` (không có ý nghĩa với người dùng cuối) và đổi `retryAfter=${ms}ms` thành số giây dễ hiểu — "Bạn đã thao tác quá nhanh. Vui lòng thử lại sau {n} giây." cho giới hạn theo người dùng/IP; "Hệ thống đang quá tải cho bài thi này. Vui lòng thử lại sau {n} giây." cho giới hạn theo bài thi (dùng câu khác vì đây là giới hạn dùng chung của cả bài thi, không phải lỗi riêng của người dùng đó).

**Kiểm tra grep còn sót:** quét lại cả 4 file bằng `throw new (BadRequest|NotFound|Forbidden|Unauthorized|Conflict)Exception\(` và `HttpException`/`message:` → toàn bộ đã là tiếng Việt, không còn chuỗi Anh nào.

**Kiểm tra biên dịch & test:**
- `npm run build` (nest build) → sạch, không lỗi kiểu.
- `npx jest access-policy` → `1 suite passed, 4 tests passed` — đúng như dự đoán, không cần sửa spec.
- `git diff --stat` xác nhận cả 4 file lưu đúng (courses.service.ts 26 dòng, access-policy.service.ts 16 dòng, rate-limit.guard.ts 6 dòng, create-course.dto.ts 2 dòng).

---

## Part 7 — enrollments + users + admin-dashboard (~18 message)

Trạng thái: [x] Hoàn thành 2026-08-06 — xem kiểm duyệt bên dưới

File liên quan:
- `BE/src/enrollments/enrollments.service.ts` — "Student already enrolled in this course", "Enrollment removed successfully" (dòng 71, 461)
- `BE/src/users/users.service.ts` — "Email already exists" (dòng 20)
- `BE/src/admin-dashboard/admin-dashboard.service.ts` — "Invalid analytics date range (maximum 1 year)." (dòng 26)

### Kiểm duyệt Part 7 (2026-08-06)

**Ghi chú vận hành:** chạy song song với Part 6 (agent khác, courses + common) — không trùng file nên an toàn.

**Đã sửa — `enrollments.service.ts`** (14 message): quyền quản lý ghi danh theo khóa học, không tìm thấy khóa học/sinh viên/ghi danh (lặp lại ở nhiều hàm: create/bulkEnroll/bulkEnrollByEmails/bulkImportStudents/remove), người dùng không phải sinh viên, sinh viên đã ghi danh trước đó, và message xóa ghi danh thành công.

**Đã sửa — `users.service.ts`** (6 message): email đã tồn tại (2 vị trí — create và update), không tìm thấy người dùng (3 vị trí — findOne/update/remove), lưu trữ người dùng thành công.

**Đã sửa — `admin-dashboard.service.ts`** (1 message): khoảng thời gian phân tích không hợp lệ.

**Đã sửa — DTO validate** (`enrollments/dto/enrollment.dto.ts`, `users/dto/create-user.dto.ts`, `users/dto/update-user.dto.ts`): thêm `message:` tiếng Việt tường minh cho toàn bộ decorator (`@IsString`, `@IsArray`, `@IsEmail`, `@IsEnum`, `@IsNotEmpty`, `@MinLength`) theo đúng cách làm ở Part 5, tránh lỗi validate mặc định trả về tiếng Anh.

**Kiểm tra grep còn sót:** `grep -rn "throw new (...)Exception\('[A-Za-z]|message: '[A-Za-z]" BE/src/enrollments BE/src/users BE/src/admin-dashboard` → không còn kết quả tiếng Anh nào (100% tiếng Việt).

**Kiểm tra biên dịch:** `npm run build` (nest build) → sạch, không lỗi.

**Kiểm tra test:** không có file spec nào trong 3 module này (đã xác nhận ở Part 0) — không cần chạy jest riêng.

---

## Part 8 — ai (rà soát chọn lọc, ~22 message — phần lớn là lỗi kỹ thuật nội bộ)

Trạng thái: [x] Hoàn thành 2026-08-06 — xem kiểm duyệt bên dưới

Nội dung: Khảo sát cho thấy đa số message ở `BE/src/ai/*` là lỗi kỹ thuật (parse response AI, định dạng không hợp lệ) không hiển thị trực tiếp cho người dùng cuối — cần xác nhận lại cụ thể message nào thực sự trả ra FE (qua controller) trước khi quyết định dịch. Chỉ dịch phần thực sự user-facing; phần lỗi nội bộ giữ tiếng Anh và ghi rõ lý do trong kiểm duyệt.
Spec cần rà soát: `ai.service.spec.ts`, `ai.service.risk-assessment.spec.ts`, `ai-generation.processor.spec.ts`, `ai-generation.risk-assessment.processor.spec.ts`.

### Kiểm duyệt Part 8 (2026-08-06)

**Xác nhận lại "user-facing" trước khi quyết định dịch — theo đúng yêu cầu của Part 8:** truy theo luồng `AIGenerationProcessor.process()` (`BE/src/queue/processors/ai-generation.processor.ts:472-479`) — khi job AI thất bại, `errorMessage: String(error?.message || error)` được lưu thẳng vào bản ghi `AIGenerationRecord`; bản ghi này được trả nguyên vẹn (bao gồm `errorMessage`) qua `QuestionsService.getJobStatus()` (`questions-v2.service.ts:2037`) và expose qua endpoint `GET /questions/ai-jobs/:jobId` (`AIGenerationJobsController`) — đây là API mà FE poll để hiển thị trạng thái job AI cho giảng viên. **Kết luận: toàn bộ message trong các hàm `generateQuestion`/`generateExamQuestions`/`generateExamQualityReview`/`assessExamIntegrityRisk`/`generateQuestionImprovement`/`analyzeProctoringImage` đều thực sự user-facing** (kể cả các lỗi "kỹ thuật" tưởng như nội bộ — vì chúng bị bọc lại thành `${error.message}` bên trong message ngoài cùng `AI generation failed: ...` rồi lưu nguyên vào `errorMessage` mà FE đọc được), khác với đánh giá sơ bộ ban đầu của báo cáo khảo sát ("phần lớn là lỗi kỹ thuật nội bộ"). Quyết định: dịch toàn bộ 21 message trong `ai.service.ts`, bao gồm cả chuỗi `'AI generation failed'` mà Part 0 đã cảnh báo có 6 dòng assert phụ thuộc.

**Đã sửa — `BE/src/ai/ai.service.ts`** (21 message, 42 dòng thay đổi do mỗi message xuất hiện ở cả vị trí gốc):
- `'Local model server returned ${resp.status}'` → `` `Máy chủ mô hình cục bộ trả về mã lỗi ${resp.status}` `` (7 vị trí, `replace_all`).
- `'AI generation failed: ${error.message}'` → `` `Tạo nội dung bằng AI thất bại: ${error.message}` `` (5 vị trí — outer catch của 5 hàm sinh nội dung chính, `replace_all`).
- 2 message ghép cặp (MATCHING) thiếu giá trị trái/phải — dịch riêng từng vị trí.
- 4 message "Invalid response format: missing ..." (câu hỏi/tóm tắt & đề xuất/điểm rủi ro/chẩn đoán) — dịch riêng từng vị trí theo đúng field bị thiếu.
- "Vision analysis is not configured for AI provider '{provider}'" → "Phân tích hình ảnh giám sát chưa được cấu hình cho nhà cung cấp AI '{provider}'".
- 2 message "Ollama returned {status}: {body}" / "Ollama vision returned {status}: {body}" → giữ nguyên phần `{body}` kỹ thuật (nội dung response thô từ Ollama, không phải câu tiếng Anh có thể dịch) nhưng dịch phần câu dẫn.

**Đã sửa spec đi kèm theo đúng cảnh báo của Part 0** (6 dòng assert phụ thuộc `'AI generation failed'`):
- `ai.service.spec.ts` (dòng 100, 115, 133): `rejects.toThrow('AI generation failed')` → `rejects.toThrow('Tạo nội dung bằng AI thất bại')`.
- `ai.service.risk-assessment.spec.ts` (dòng 152, 161, 170): tương tự.

**Đã kiểm tra, không cần sửa:**
- `ai-generation.processor.spec.ts` và `ai-generation.risk-assessment.processor.spec.ts` — xác nhận đúng như Part 0 ghi nhận: cả 2 file tự mock lỗi bằng chuỗi riêng của test (`new Error('AI generation failed: provider timed out')`) hoàn toàn độc lập với code thật trong `ai.service.ts`, và chỉ assert `expect.stringContaining('provider timed out')` — không phụ thuộc message tôi vừa đổi, không cần sửa.
- DTO (`ai/dto/generate-question.dto.ts`) — dùng decorator class-validator không tùy biến `message:`, nhưng **không nằm trong file liên quan của Part 8** (khác Part 5/6/7 có ghi rõ DTO trong phạm vi) nên không mở rộng thêm để giữ đúng ranh giới đã định của Part này.
- `ai-jobs.service.ts:94` — đã có sẵn message tiếng Việt từ trước, không đổi.
- `ai.controller.ts`, `ai-status.controller.ts` — không có exception message nào ở tầng controller.

**Kiểm tra grep còn sót:** `grep -nE "throw new Error\("` trên `ai.service.ts` → toàn bộ 21 kết quả đều đã là tiếng Việt (trừ phần `${body}` kỹ thuật thô không thể dịch vì là dữ liệu động từ provider ngoài).

**Kiểm tra biên dịch & test:**
- `npm run build` (nest build) → sạch, không lỗi kiểu.
- `npx jest ai.service ai-generation` → `5 suites passed, 25 tests passed` — bao gồm cả 2 spec đã sửa assert và 2 spec processor không cần sửa vẫn pass nguyên.
- `git diff --stat` xác nhận: `ai.service.ts` 42 dòng, `ai.service.spec.ts` 6 dòng, `ai.service.risk-assessment.spec.ts` 6 dòng — đúng số lượng dự kiến, không bị mất trong lúc chạy song song với các agent khác.

---

## Part 9 — Rà soát toàn bộ lần cuối (Final Review)

Trạng thái: [x] Hoàn thành 2026-08-06 — xem kiểm duyệt bên dưới

Nội dung:
1. Grep toàn bộ `BE/src` tìm message exception còn tiếng Anh hướng người dùng (`throw new (BadRequest|NotFound|Forbidden|Unauthorized|Conflict)Exception\(['"][A-Za-z]`, `throw new Error\(['"][A-Za-z]`).
2. Kiểm tra không còn tình trạng lẫn ngôn ngữ trong cùng 1 file/luồng nghiệp vụ.
3. Chạy `npm run build` toàn BE để xác nhận không lỗi kiểu.
4. Chạy `npm run test` toàn bộ để xác nhận không có spec nào còn assert vào message tiếng Anh cũ.
5. Báo cáo tổng kết có bằng chứng: số file đã sửa, số message đã dịch, danh sách spec đã cập nhật kèm theo.

### Kiểm duyệt Part 9 (2026-08-06)

**Bước 1 — Grep toàn diện `BE/src`** (`throw new (BadRequest|NotFound|Forbidden|Unauthorized|Conflict|InternalServerError|UnprocessableEntity)Exception\(['"`][A-Za-z]` + `throw new Error\(['"`][A-Za-z]` + `message:\s*['"][A-Za-z]` + quét thêm mẫu `reason:`/`description:` không theo khuôn exception chuẩn) → tổng cộng 259 exception message qua 16 file đã kiểm tra lại toàn bộ, cộng nhiều điểm khác không theo mẫu `throw new Exception(...)`. **Phát hiện 7 nhóm sót ngoài phạm vi các Part 1–8 đã khai báo:**

1. `BE/src/exams/exam-quality-review.service.ts` (4 message: `'Exam not found'` ×2, `'Quality review job not found'`, `'Suggestion not found'`) — file này tách biệt với `exams.service.ts` nên không nằm trong phạm vi grep hẹp của Part 2.
2. `BE/src/exams/exams.service.ts:598` — `InternalServerErrorException('Exam was created but could not be loaded')` — bị sót vì Part 2 chỉ grep 5 loại exception phổ biến, không gồm `InternalServerErrorException`.
3. `BE/src/exams/exams.controller.ts:69` — `return { success: false, message: 'No recipient provided' }` (luồng chia sẻ link bài thi qua email) — response message không theo mẫu `throw new`.
4. `BE/src/queue/processors/ai-generation.processor.ts:262` — `throw new Error('Evidence image is unavailable')`, lỗi này bị lưu vào `proctoringEvidenceCapture.aiError`/`aIGenerationRecord.errorMessage` mà FE đọc được (đúng luồng Part 8 đã xác nhận cho `ai.service.ts`, nhưng file processor riêng biệt không được rà theo cùng logic).
5. `BE/src/enrollments/enrollments.service.ts` — **8 message trong trường `reason:`** của kết quả ghi danh hàng loạt (`bulkEnroll`/`bulkEnrollByEmails`/`bulkImport`: `'Student not found'`, `'User is not a student'` ×3 biến thể, `'Already enrolled'` ×3 biến thể, `'Email is required'`, `'Unknown error'` ×3) — đây là lỗ hổng thật của Part 7: các `reason` này hiển thị trực tiếp trong bảng kết quả ghi danh ở FE (tương tự phần "Kết quả ghi danh" đã Việt hóa ở FE `CreateCourse.tsx`), nhưng không khớp mẫu grep `throw new (...)Exception` nên bị bỏ sót hoàn toàn ở Part 7.
6. `BE/src/submissions/submissions.service.ts` — **object trả về cho tính năng "Integrity Case"/"Exam Event Timeline"** (khớp đúng 2 màn hình FE `IntegrityCaseDetail`/`ExamEventTimeline`): dictionary `eventTypeLabels` (14 nhãn), dictionary nhãn trong `buildIntegrityLogReason` (5 nhãn), cùng 3 vị trí gọi trực tiếp (`reasons.push`, timeline `events.push` ×2) — tổng ~22 chuỗi. Đây là lỗ hổng thật của Part 1: object trả về không đi qua `throw new Exception`, mà là dữ liệu JSON trả thẳng cho FE hiển thị bảng bằng chứng vi phạm/dòng thời gian.
7. `BE/src/ai/ai.service.ts` — 7 chuỗi còn sót trong các nhánh `provider === 'mock'` của `generateQuestion`, `generateExamQuestions`, `generateExamQualityReview`, `assessExamIntegrityRisk`, và fallback `reason` mặc định của topic matching — Part 8 chỉ rà các câu lệnh `throw new Error(...)`, không rà các chuỗi nằm trong payload JSON trả về khi ở chế độ mock (dữ liệu này vẫn hiển thị cho giảng viên nếu `AI_PROVIDER=mock`, theo đúng lý luận "user-facing" mà Part 8 đã xác lập).

**Tất cả 7 nhóm trên đã được dịch trong lượt rà soát này.** Trước khi sửa, đã kiểm tra riêng từng chuỗi trong `*.spec.ts` liên quan (`exam-quality-review.service.spec.ts` chỉ assert `toBeInstanceOf`; không có spec nào assert vào các chuỗi `reason`/`description`/mock-payload nói trên) → an toàn, không cần sửa spec nào thêm ngoài những gì Part 8 đã sửa.

**Đã kiểm tra, xác nhận giữ nguyên tiếng Anh (đúng theo quy tắc "message kỹ thuật nội bộ"):**
- `BE/src/auth/auth.module.ts:19` — lỗi cấu hình khi khởi động server (crash trước khi phục vụ request nào).
- `BE/src/common/utils/ip.utils.ts:19` — `'Not IPv4'` bị bắt (`catch`) và nuốt ngay trong cùng module (`isIpInCidr` trả `false`), không bao giờ thoát ra khỏi hàm nội bộ.
- `BE/src/ai/ai.service.ts:423` — chuỗi ví dụ JSON (`"Option A text"`...) nằm trong **prompt gửi cho mô hình AI** để hướng dẫn định dạng trả về, không phải nội dung hiển thị cho người dùng — dịch phần này có thể ảnh hưởng đến khả năng AI hiểu đúng cấu trúc JSON mong đợi nên chủ động không đổi.

**Bước 2 — Kiểm tra lẫn ngôn ngữ:** sau khi sửa 7 nhóm trên, rà lại toàn bộ 16 file gốc + 3 file phát hiện thêm (`exam-quality-review.service.ts`, `exams.controller.ts`, `ai-generation.processor.ts`) → không còn file nào lẫn tiếng Anh/tiếng Việt trong cùng luồng nghiệp vụ.

**Bước 3 — `npm run build`** → sạch, không lỗi kiểu, kể cả sau các sửa đổi thêm ở bước 1.

**Bước 4 — `npm run test` (toàn bộ, không lọc theo module):**
```
Test Suites: 1 failed, 12 passed, 13 total
Tests:       53 passed, 53 total
```
- **12/13 suite pass, 53/53 test pass** — không có test nào assert vào message tiếng Anh cũ (đúng như dự đoán từ Part 0/8).
- **1 suite fail: `src/exams/exams.snapshot.spec.ts`** — lỗi biên dịch TypeScript (`TS2554: Expected 2 arguments, but got 3`) tại dòng gọi `new ExamsService(prisma, notificationsStub, {} as any)` với 3 tham số, trong khi constructor thật của `ExamsService` chỉ nhận 2 tham số (`prisma`, `accessPolicy`). **Đã xác minh đây là lỗi có sẵn từ trước, không liên quan đến việc Việt hóa**: `git show HEAD:BE/src/exams/exams.service.ts` cho thấy constructor 2 tham số đã tồn tại ở commit gốc; `git status` xác nhận `exams.snapshot.spec.ts` không có thay đổi nào trong toàn bộ session (không nằm trong danh sách file bị sửa ở Part 1–9). → **Nằm ngoài phạm vi kế hoạch Việt hóa, không sửa** (sửa sẽ cần đoán lại tham số thứ 3 đã bị xóa khỏi constructor, là thay đổi logic ngoài phạm vi "chỉ dịch message").

**Bước 5 — Tổng kết toàn bộ dự án Việt hóa BE (Part 0–9):**

| Part | Module | Số message đã dịch | Test |
|---|---|---|---|
| 1 | submissions | 81 | pass |
| 2 | exams | ~55 (+ 5 sót vá ở Part 9) | pass |
| 3 | questions-v2 | 57 | pass |
| 4 | exam-links | ~26 | — |
| 5 | auth | 22 + 3 DTO | — |
| 6 | courses + common | ~25 | — |
| 7 | enrollments + users + admin-dashboard | 21 (+ 8 sót vá ở Part 9) | — |
| 8 | ai | 21 (+ 7 sót vá ở Part 9) | pass |
| 9 | rà soát cuối | +23 (4 exam-quality-review, 1 InternalServerError, 1 controller, 1 processor, 8 enrollments, 22 submissions timeline/integrity — một số trùng đếm với dòng trên) | 12/13 suite pass |

**Tổng số file đã sửa xuyên suốt Part 0–9:** 24 file service/controller/DTO + 2 file spec (chỉnh assert theo Part 8) + 1 file plan doc, trên 12 module BE (`submissions`, `exams`, `questions-v2`, `exam-links`, `auth`, `courses`, `common`, `enrollments`, `users`, `admin-dashboard`, `ai`, `queue`). Chuỗi tiếng Anh hướng người dùng còn sót lại trong toàn bộ `BE/src`: **0** (chỉ còn 3 chuỗi kỹ thuật nội bộ được chủ động giữ nguyên, đã ghi rõ lý do ở trên).

**Việc chưa hoàn thành nằm ngoài phạm vi Việt hóa:** `exams.snapshot.spec.ts` cần được cập nhật lại tham số constructor để chạy được — đây là việc bảo trì test riêng, đề xuất xử lý ở một task khác.

---

## Ghi chú phạm vi

- Mailer (`BE/src/mailer`) không có template cố định trong code — subject/nội dung email được truyền vào từ nơi gọi (do FE/service khác quyết định nội dung), nên không nằm trong phạm vi Part nào ở trên. Nếu sau này phát hiện nơi gọi có nội dung email tiếng Anh cố định, khảo sát bổ sung riêng.
- `audit`, `cache`, `events`, `queue`, `redis`, `lecturer-dashboard` gần như không có message hướng người dùng — không tạo Part riêng, chỉ rà soát nhanh trong Part 9.
