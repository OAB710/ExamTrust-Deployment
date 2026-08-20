# Kế hoạch dựng lại Seed Data (đề xuất — chưa triển khai)

Ngày lập: 2026-08-19
Mục tiêu: thay toàn bộ bộ seed hiện tại (10 script rời, phát triển tự phát, đã xác nhận có bug data thật — xem `SEED_DATA_ANALYSIS.md` và báo cáo trace issue 2/3 trong cùng phiên) bằng một bộ seed **thống nhất, đúng logic nghiệp vụ, phân bố theo thời gian hợp lý** để phục vụ demo/thuyết trình và test chart/analytics.

> Đây là **kế hoạch**, chưa viết code. Phần 12 có các câu hỏi cần anh xác nhận trước khi tôi bắt đầu implement.

---

## 0. Vì sao phải làm lại (căn cứ)

- **Bug đã xác nhận bằng data production thật** (exam `91ad0ffb...`, submission `d5ae6859...`, seed gốc bởi trungducnguyen4 commit `0af6e6d9`):
  - `seed-analytics-ui-demo.ts` không set `SubmissionAnswer.pointsAwarded` cho bất kỳ câu nào (kể cả câu đúng) → FE hiện "0/1 điểm".
  - Cùng file set cứng `ExamSubmission.status='GRADED'` bất kể đề có câu hỏi cần chấm tay (ESSAY/SHORT_ANSWER/FILL_IN_BLANK) hay không, và không set `manualGradedAt` cho các câu đó → trạng thái "Đã chấm" nhưng vẫn còn "X/X cần chấm", không publish được.
- **Cấu trúc hiện tại đã phình to không kiểm soát**: 10 script phụ thuộc lẫn nhau theo thứ tự cứng, ngưỡng số sinh viên khác nhau giữa script (10/18/36), 2 script bị "mồ côi" phụ thuộc course `CLS001..010`/`DATNUO-LECT-01/02` — di sản từ một đồ án khác ("Toán lớp 1"), không liên quan ngữ cảnh ExamTrust hiện tại.
- Anh xác nhận: **hay dùng "Reset DB" qua Zalo bot** → script này chạy thẳng `seed-master.ts` trên production mỗi lần — nghĩa là mọi lỗi trong seed sẽ lặp lại y nguyên trên production mỗi lần reset. Cần làm đúng ngay từ seed, không vá từng chỗ.

## 1. Nguyên tắc thiết kế bắt buộc (rút ra từ các bug đã tìm được)

Mọi script mới phải tuân thủ, không ngoại lệ:

1. **Không set `SubmissionAnswer.pointsAwarded`/`status` thủ công lệch với logic BE thật.** Seed phải mô phỏng đúng invariant của `submissions.service.ts`:
   - Câu auto-gradable (`MULTIPLE_CHOICE`, `TRUE_FALSE`, `FIND_ERROR`, và `MATCHING`/`ORDERING` khi có `correctAnswer.pairs`/`items`) → `pointsAwarded` = điểm câu nếu đúng, `0` nếu sai, set ngay lúc tạo submission.
   - Câu manual (`ESSAY`, `FILL_IN_BLANK`, và `MATCHING`/`ORDERING` không có đáp án cấu trúc) → `pointsAwarded = null` cho tới khi "chấm tay giả lập" (set `manualGradedAt` + `pointsAwarded` cùng lúc).
   - `ExamSubmission.status`: `'SUBMITTED'` nếu còn câu manual chưa chấm, chỉ chuyển `'GRADED'` sau khi **toàn bộ** câu manual đã có `manualGradedAt`. Không bao giờ set `GRADED` trực tiếp nếu có câu manual pending.
2. **Cố ý để lại một số submission ở trạng thái "chưa chấm hết"** (để demo đúng màn `/results` hiển thị "X/X cần chấm" — nhưng lần này status phải khớp thật: `SUBMITTED`, không phải `GRADED` giả).
3. Idempotent bằng `upsert`/kiểm tra tồn tại trước khi tạo — giữ pattern đã đúng của các script hiện tại.
4. Không dùng `Date.now()`/random không seed cố định trong script (để chạy lại cho kết quả giống nhau, dễ so sánh khi debug) — dùng ngày cố định (ví dụ mốc "hôm nay" truyền vào qua constant ở đầu file) + hàm random có seed cố định (LCG đơn giản hoặc offset theo index) để phân bố nhưng tái lập được.
5. Xoá hẳn nhánh phụ thuộc "CLS001 Toán lớp 1 / DATNUO" không liên quan ExamTrust — xem quyết định ở mục 12.1.

## 2. Người dùng

| Vai trò | Số lượng | Quy ước |
|---|---|---|
| Admin | 1 | `admin@tdtutdtu.edu.vn` (giữ nguyên, không đổi để không phá thói quen đăng nhập demo) |
| Lecturer | 10 | `lecturer01`..`lecturer10@tdtutdtu.edu.vn`, mỗi người có `department` khác nhau (CNTT, Toán, Anh văn...) để chart "theo khoa" (nếu có) không bị dồn 1 cục |
| Student | 20 | `522h0001`..`522h0020@tdtutdtu.edu.vn` |

- `User.createdAt` của cả 3 nhóm **phải trải ngày**, không tạo cùng lúc — ví dụ trải trong 6 tháng gần nhất (admin ngày đầu tiên, lecturer trải tuần 1-2, student trải tuần 2-8) để chart "Tăng trưởng người dùng" (`AdminAnalyticsDashboard.tsx`) không phải 1 cột duy nhất.
- 20 sinh viên cần có **phổ năng lực khác nhau cố định theo index** (không random thuần) để mọi exam đều tái lập cùng kiểu phân bố:
  - index 0-3 (`522h0001`-`522h0004`): học lực khá-giỏi (điểm 8-10)
  - index 4-13 (`522h0005`-`522h0014`): trung bình (điểm 5-8, dải rộng nhất — 10/20 sinh viên)
  - index 14-17 (`522h0015`-`522h0018`): yếu (điểm 3-5)
  - index 18-19 (`522h0019`, `522h0020`): **cặp gian lận** — 2 sinh viên riêng, độc lập với mọi nhóm trên, hành vi: ngồi cạnh nhau trong giờ thi, đáp án giống bất thường ở nhiều câu, nộp bài cách nhau vài chục giây, có integrity log giống pattern nhau (mục 7).
  - **Case "làm quá nhanh"**: không gộp vào cặp gian lận (đó là 2 việc khác nhau về bản chất — làm tắt sẽ khiến 2 tín hiệu integrity trộn lẫn, khó demo riêng). Xử lý tự nhiên: chọn 1 em trong nhóm khá-giỏi (`522h0002`) làm nhanh vì đã học kỹ trước — đây là hành vi hợp lý thật (sinh viên giỏi làm nhanh, KHÔNG bị coi là gian lận, không kèm integrity log bất thường), khác hẳn về ý nghĩa với cặp gian lận ở trên. Vẫn giữ đủ 20 sinh viên, không cần tăng số lượng.

## 3. Khoá học / lớp học phần

**Bỏ hẳn** toàn bộ roster course cũ (`CLS001..010`, `DATNUO-LECT-01/02`, `SEED-101`, `ANALYTICS-2026`, `MONITOR-2026`, `DUPLICATE-2026`, `QHIST-2026`, `TOPIC-DEMO-DB`) — theo yêu cầu, không giữ lại gì (kéo theo bỏ luôn `seed-course-question-banks.ts`, `seed-cls001-grade1-math.ts` và các script `verify-cls001-demo.ts`/`backfill-enrollments.ts`/... phụ thuộc chúng, vì các script đó vốn đã không tái tạo được trên DB mới — xem `SEED_DATA_ANALYSIS.md` mục 4.1).

### 3.1. Mã khoá học (`Course.code`) — bám đúng logic sinh code tự động của hệ thống

Đã đọc `BE/src/courses/courses.service.ts:56-109` (`generateCourseCode`) — đây là hàm **thật** BE dùng khi giảng viên tạo course qua UI, seed sẽ gọi lại đúng cùng logic (không tự đặt mã tuỳ ý như `CS101` ở bản nháp trước):

```
courseToken  = 6 ký tự đầu của tên course, bỏ dấu, viết hoa, bỏ khoảng trắng   (buildToken(name, 6))
creatorToken = 4 ký tự đầu của fullName giảng viên, cùng quy tắc              (buildToken(lecturer.fullName, 4))
code = `${courseToken}-${creatorToken}-${STT 2 số, tăng dần nếu trùng base}`
```

Ví dụ: course "Nhập môn Lập trình" của giảng viên "Nguyễn Văn A" → `NHAPMO-NGUYE-01`. Seed sẽ implement lại đúng 2 hàm `toAsciiUpper`/`buildToken` (copy nguyên logic, không viết lại khác) để mã sinh ra giống 100% như nếu giảng viên tự tạo qua giao diện.

### 3.2. Roster course mới — đúng ngữ cảnh CNTT, tên hay, nhiều chủ đề

10 giảng viên → mỗi người 1-3 course, tổng khoảng **18-20 course**, đủ nhiều chủ đề trong ngành CNTT (không dồn hết vào "lập trình cơ bản"):

| Giảng viên | Course phụ trách (tên đầy đủ, tiếng Việt) | Vai trò trong plan |
|---|---|---|
| lecturer01 | *Nhập môn Công nghệ Thông tin* | Course chính — đủ loại câu hỏi/trạng thái/case integrity, dùng demo chart |
| lecturer01 | **"Kiểm thử 7 loại câu hỏi"** (xem 3.3 — course riêng theo yêu cầu) | Course kiểm thử, chỉ 7 câu hỏi |
| lecturer02 | *Cấu trúc Dữ liệu và Giải thuật* | Nhiều `QuestionVersion`/lịch sử chỉnh sửa, độ khó trải rộng |
| lecturer03 | *Cơ sở Dữ liệu* | Case trùng lặp câu hỏi (exact + semantic) |
| lecturer04 | *Mạng máy tính* | Case topic tương đồng xuyên course với lecturer05 |
| lecturer05 | *An toàn & Bảo mật Thông tin* | Case topic tương đồng xuyên course với lecturer04; nhiều integrity signal (hợp lý vì môn an ninh mạng) |
| lecturer06 | *Phát triển Ứng dụng Web* | Đề có ma trận đề thi + nhiều lượt làm (test `ExamGradingStrategy`) |
| lecturer07 | *Trí tuệ Nhân tạo* | Case AI-assist (`AIGenerationRecord`/`ExamQualityReviewItem`) nếu mục 12.5 xác nhận cần |
| lecturer08 | *Nhập môn Trí tuệ Doanh nghiệp (BI)* + *Toán rời rạc* | 2 course nhỏ, câu hỏi ORDERING/MATCHING có & không đáp án cấu trúc |
| lecturer09 | *Kỹ năng mềm & Giao tiếp CNTT* | Course nhẹ, câu ESSAY/FILL_IN_BLANK là chủ đạo (nhấn case chấm tay tự luận) |
| lecturer10 | *Quản trị Dự án Phần mềm* | Course nhẹ, chủ yếu lấp roster, 1-2 đề đơn giản |

- Mỗi course enroll phần lớn 20 sinh viên; một vài course (VD 3.10 lecturer10) chỉ enroll 12-15 để có case "sinh viên chưa tham gia hết".
- `Course.academicYear`/`term`: gán theo 2 kỳ liên tiếp có thật theo lịch (VD `"2025-2026"` kỳ `TERM_1` cho các course "cũ hơn", `TERM_2` cho course mới hơn) — **không** gán ngẫu nhiên, phải khớp với `createdAt` của course đó (course TERM_1 phải có `createdAt` sớm hơn course TERM_2).
- `Course.createdAt` trải trong ~5-6 tháng gần "hôm nay" theo đúng thứ tự kỳ học, mỗi giảng viên tạo course của mình sau khi chính giảng viên đó được tạo (`createdAt` course > `createdAt` lecturer — ràng buộc thời gian hợp lý, tránh "course sinh ra trước cả giảng viên tạo nó" như lỗi thường gặp khi set ngày tuỳ ý).

### 3.3. Course riêng: "Kiểm thử 7 loại câu hỏi" (theo yêu cầu cụ thể)

- Chủ nhiệm: **lecturer01**. Chỉ enroll **duy nhất student01** (`522h0001`).
- Đúng **7 câu hỏi**, mỗi câu 1 loại, đúng 7 loại thật đang tồn tại trên UI tạo câu hỏi (xem mục 4.0) — không dùng loại nào ngoài 7 loại đó.
- Có đúng 1 đề thi nhỏ dùng cả 7 câu, đã có 1 lượt làm của student01, chấm hoàn chỉnh (kể cả câu ESSAY/FILL_IN_BLANK đã chấm tay) → mục đích: đây là bộ dữ liệu "sạch, tối giản, dễ kiểm" để anh tự tay verify từng loại câu hỏi hiển thị đúng, không lẫn với dữ liệu lớn của các course khác.

## 4. Ngân hàng câu hỏi

### 4.0. Sửa lại: chỉ 7 loại câu hỏi, không phải 9 — đã kiểm tra lại theo đúng góc nhìn UI

Bản nháp trước dùng 9 loại theo comment trong `schema.prisma:386` (`MULTIPLE_CHOICE, MULTI_SELECT, TRUE_FALSE, SHORT_ANSWER, ESSAY, FILL_IN_BLANK, MATCHING, ORDERING, FIND_ERROR`) — **sai theo thực tế UI**, đã soát lại trực tiếp 2 màn tạo câu hỏi thật:

- `FE/src/features/lecturer/QuestionEditor.tsx:691-707` — 7 `SelectItem`: `multiple_choice, true_false, fill_blank, matching, find_error, ordering, essay`.
- `FE/src/features/lecturer/CreateExam.tsx:1966-1972` (tạo câu hỏi thủ công ngay trong lúc tạo đề) — **đúng 7 loại giống hệt**, cùng thứ tự.

→ `MULTI_SELECT` và `SHORT_ANSWER` tồn tại trong schema/enum comment và trong logic chấm (`AUTO_GRADED_TYPES` có `MULTI_SELECT`; formatter chấm tay có nhánh `SHORT_ANSWER`) nhưng **không có bất kỳ đường nào tạo được loại này qua UI hiện tại** — tức là dữ liệu "không thể tồn tại" nếu tạo qua sản phẩm thật. Seed sẽ **chỉ dùng đúng 7 loại** (`MULTIPLE_CHOICE, TRUE_FALSE, FILL_IN_BLANK, MATCHING, ORDERING, FIND_ERROR, ESSAY`) để dữ liệu mẫu giống với những gì một giảng viên thật có thể tạo ra — không bịa thêm loại không thể tạo được qua giao diện.

### 4.1. Số lượng & phân bố

- Mỗi course: số câu hỏi **dao động, tối đa 100 câu/course** (không cố định cùng 1 số cho mọi course — course chính lecturer01 ("Nhập môn CNTT") nhiều nhất ~80-100 câu đủ cả 7 loại x nhiều topic; course nhẹ (lecturer09, lecturer10) chỉ 15-25 câu). Riêng course "Kiểm thử 7 loại câu hỏi" (3.3) cố định đúng 7 câu.
- Mỗi course có đủ **cả 7 loại câu hỏi** ở tỷ trọng hợp lý theo đặc thù môn (VD "Kỹ năng mềm" của lecturer09 nghiêng nhiều ESSAY/FILL_IN_BLANK hơn MULTIPLE_CHOICE — đã nêu ở bảng 3.2), không rải đều máy móc 1/7 cho mọi course.
- **Trạng thái lifecycle** (`QuestionLifecycleStatus`): đa số `PUBLISHED`, một ít `DRAFT`/`IN_REVIEW` (đang soạn, chưa dùng cho đề nào), 1-2 `ARCHIVED` mỗi course lớn — để filter theo trạng thái trong question-bank UI có dữ liệu thật ở mọi nhóm, không rỗng.
- **Độ khó** (`Question.difficulty`) — đã tra code thật, không còn để mở: `FE/src/features/lecturer/question-editor-persistence.ts:18-21` (`toEditorDifficulty`) chia giá trị DB cho 10 nếu > 1 để ra thanh trượt 0-1 trên UI, và `QuestionEditor.tsx:1058-1081` chia 3 vùng: `<=0.4` = Dễ, `0.4-0.6` = Trung bình, `>=0.6` = Khó. → **DB lưu số nguyên 1-10** (không phải 1-5). Seed sẽ trải giá trị 1-10 theo phân phối chuông nhẹ quanh 4-6 (Trung bình chiếm nhiều nhất, ít câu ở 1-2 hoặc 9-10), không dồn hết về giá trị `default(1)`.
- `Question.createdAt`/`updatedAt` phải **sau** `createdAt` của course chứa nó và **sau** `createdAt` của giảng viên tạo nó — trải theo nhiều ngày trong "học kỳ" của course đó, không set cùng 1 timestamp cho hàng chục câu.

### 4.2. Lịch sử phiên bản câu hỏi

~10-15 câu trong course *Cấu trúc Dữ liệu và Giải thuật* (lecturer02) có 2-3 `QuestionVersion`, kèm `QuestionStatistics` khác nhau giữa version (bản cũ khó hơn/dễ hơn bản mới, `versionNo` tăng dần theo `createdAt` tăng dần) — giữ đúng mục đích của `seed-question-history-demo.ts` cũ nhưng gắn vào course thật, không tạo course rời riêng cho mục đích này.

### 4.3. Trùng lặp câu hỏi

Trong course *Cơ sở Dữ liệu* (lecturer03): ~6 cặp trùng chính xác (exact — nội dung giống hệt, do 2 lần nhập nhầm) và ~6 cặp trùng ngữ nghĩa (semantic — đổi từ/cấu trúc câu nhưng hỏi cùng kiến thức), cộng một số câu đơn không trùng làm baseline để tính năng lọc trùng có cả case dương/âm.

### 4.4. Chủ đề (`Topic`) — để tính năng liên quan topic dùng và hiển thị ổn

- Mỗi course có 3-8 `Topic` thật khớp với nội dung môn (VD *Cấu trúc Dữ liệu* → topic "Danh sách liên kết", "Cây nhị phân", "Đồ thị", "Sắp xếp"...), **không đặt tên topic chung chung kiểu "Chương 1/Chương 2"**.
- Mọi `Question` được gắn `QuestionTopic` (topic thật của môn đó, `weight` hợp lý 0.3-1.0) — tránh tình trạng câu hỏi không có topic nào (sẽ làm view lọc theo topic bị thiếu dữ liệu).
- Case "tương đồng chủ đề xuyên course" (mục 3.2): course *Mạng máy tính* (lecturer04) và *An toàn & Bảo mật Thông tin* (lecturer05) mỗi course có 1-2 topic nội dung gần giống nhau có chủ đích (VD "Bảo mật mạng" ở cả 2 course, diễn đạt khác nhau) — để tính năng gợi ý topic tương đồng AI có dữ liệu thật để so sánh, không trả về rỗng khi demo.
- `CourseTopic` (nếu là bảng liên kết topic dùng chung nhiều course) cần được seed nhất quán với các topic "xuyên course" ở trên.

## 5. Đề thi (`Exam`)

Phân bố đủ các `ExamStatus` (`DRAFT, PUBLISHED, ONGOING, COMPLETED, ARCHIVED`) và không chỉ 1 đề/course:

- Mỗi course lớn (lecturer01 "Nhập môn CNTT", lecturer02 "CTDL&GT", lecturer03 "CSDL", lecturer06 "Phát triển Web") có **3-4 đề**: 1 đã `COMPLETED` + công bố kết quả lâu rồi (case bình thường), 1 `COMPLETED` nhưng **chưa công bố** (case đang chờ chấm/publish — cần ít nhất 1 đề vẫn còn submission `SUBMITTED` do câu manual pending, đúng invariant mục 1.2), 1 `ONGOING` (đang mở, một số sinh viên `IN_PROGRESS`), 1 `DRAFT` (chưa publish, không có submission). Course nhẹ (lecturer04/05/07/08/09/10) mỗi course 1-2 đề, không cần đủ 4 trạng thái.
- Ít nhất 1 đề (course lecturer06 "Phát triển Web") dùng **ma trận đề thi** (matrix/exam config ở `ExamQuestion`/`ExamSnapshot`), có đủ câu FILL_IN_BLANK trong ma trận đó — để khi anh test lại issue 4 (loại "Điền khuyết") có sẵn 1 đề ma trận thật để đối chiếu.
- Ít nhất 1 đề có nhiều lượt làm (`attemptNo` > 1) để test `ExamGradingStrategy` khác `LAST_ATTEMPT` (HIGHEST/AVERAGE/FIRST_ATTEMPT).
- `startTime`/`endTime` các đề trải trong 4-6 tháng gần nhất, không dồn cùng ngày.
- **Bỏ qua `ExamLink`** (link thi công khai) — theo yêu cầu, không seed vì chưa rõ tính năng này có đang thật sự được dùng trong sản phẩm.

## 6. Bài làm & chấm điểm — trọng tâm sửa bug

Đây là phần quan trọng nhất vì trực tiếp liên quan issue 2 & 3 đã xác nhận.

- Với **mỗi đề COMPLETED đã publish**: toàn bộ submission phải `status='GRADED'`, mọi câu manual có `manualGradedAt` set + `pointsAwarded` hợp lệ (không NULL), mọi câu auto có `pointsAwarded` đúng theo `isCorrect` (0 nếu sai, = điểm câu nếu đúng — không bao giờ để NULL).
- Với **đề COMPLETED chưa publish**: cố ý để 1-2 submission có câu manual (ESSAY/FILL_IN_BLANK) **chưa chấm** (`manualGradedAt=null`, `pointsAwarded=null`), `status='SUBMITTED'` (không phải GRADED) — để trang `/results` hiện đúng "X/X cần chấm" và nút publish bị khoá đúng nghĩa, không phải do lỗi seed.
- Điểm số (`score`) phân bố thực tế theo "phổ năng lực" đã gán ở mục 2 — không phải điểm ngẫu nhiên đều, để histogram "Phân bố kết quả" (yêu cầu `sampleSize >= 10`, xem `AdminAnalyticsDashboard.tsx`) có hình chuông thật, không dẹt/không lệch.
- `startedAt`/`submittedAt` trải qua nhiều ngày/nhiều giờ trong ngày (sáng/tối) — phục vụ chart "Hoạt động nộp bài" theo `period` (line chart `started`/`completed`).
- 2 case integrity đặc biệt (mục 2): 1 cặp gian lận (câu trả lời giống bất thường + nộp gần giờ nhau), 1 sinh viên hoàn thành quá nhanh (`elapsedMinutes` thấp bất thường so với thời lượng đề).
- Giữ ít nhất 1 `ExamSubmissionRegradeLog` và 1-2 `ScoreAdjustment` (case phúc khảo/điều chỉnh điểm thủ công) gắn với 1 submission đã GRADED — tính năng này chưa có script nào seed hiện tại (theo research), cần thêm mới.

## 7. Giám thị / tính toàn vẹn thi (Proctoring & Integrity)

Dựng lại đúng phạm vi `seed-monitor-ui-demo.ts` cũ nhưng gắn vào course/đề thật ở mục 3/5 thay vì course riêng — ưu tiên đặt nhiều signal ở course *An toàn & Bảo mật Thông tin* (lecturer05, hợp lý về ngữ cảnh) và course chính lecturer01:

- Đủ **cả 10 loại** `IntegrityLog.eventType` đã biết (`tab_switch, mouse_anomaly, mouse_idle, copy, paste, fullscreen_exit, window_blur, face_not_detected, camera_stream_ended, camera_recovery_timeout`), trải trên nhiều phiên/nhiều ngày khác nhau — không dồn 1 submission, không dồn 1 ngày (yêu cầu "lưu tâm các loại toàn vẹn" — đảm bảo mọi loại đều có ít nhất 2-3 bản ghi thật, xuất hiện ở nhiều tuần khác nhau để chart theo thời gian không bị 1 cột).
- `IntegrityReview`: một số log ở trạng thái `REVIEWED`/`CONFIRMED` (đã xử lý, có `penaltyPercent`), một số `PENDING` (chưa xử lý) — để chart "Tín hiệu toàn vẹn" (`signaled`/`reviewed` theo `period`) có cả 2 cột khác nhau, không bằng nhau.
- `AnomalyFlag`/`ProctoringEvidenceCapture`: vài case có ảnh/video evidence giả lập trạng thái `CAPTURED`/`FAILED` khác nhau.
- Cặp collusion (mục 2) phải thể hiện qua **cả 2 lớp dữ liệu**: `IntegrityLog` phù hợp (vd cùng pattern gõ phím/copy-paste giống nhau) **và** đáp án `SubmissionAnswer.answer` giống bất thường giữa 2 sinh viên đó trên cùng 1 đề — để 2 tính năng (giám thị UI và phân tích đáp án trùng) cùng phản ánh 1 case nhất quán, tránh lỗi kiểu "hiện tín hiệu ở màn này nhưng màn khác không thấy gì" như đã gặp ở issue 3.

## 8. Trợ lý AI — giải thích đơn giản

Trong hệ thống có tính năng: khi giảng viên soạn câu hỏi, có thể bấm nút để **AI tự sinh nội dung/đáp án/giải thích** giúp, hoặc AI tự **soát chất lượng đề thi** (báo câu nào có vấn đề trước khi công bố). Mỗi lần dùng tính năng này, hệ thống lưu lại 1 bản ghi "AI đã làm gì, kết quả ra sao, giảng viên có duyệt hay không" — đó là 2 bảng `AIGenerationRecord` và `ExamQualityReviewItem`.

Hiện **chưa có script seed nào tạo dữ liệu mẫu cho 2 bảng này** — nghĩa là nếu vào các màn liên quan đến AI-hỗ-trợ-tạo-câu-hỏi/soát-đề trên bản demo, có thể sẽ thấy trống trơn (không phải do bug, chỉ vì chưa seed).

Việc thêm dữ liệu mẫu ở đây **không bắt buộc** cho các case chính (chấm điểm, giám thị, chart...) — chỉ cần nếu anh muốn demo luôn cả tính năng AI hỗ trợ này. Nếu chưa cần, có thể bỏ qua ở lần seed đầu, thêm sau cũng không ảnh hưởng gì tới phần còn lại.

## 9. Cấu trúc file đề xuất

Giữ mô hình orchestrator (`seed-master.ts` gọi tuần tự các file con) nhưng **gọn lại đáng kể**, mỗi file gắn 1 nhóm trách nhiệm rõ, không phụ thuộc chồng chéo:

1. `seed-users.ts` — 1 admin, 10 lecturer, 20 student, ngày tạo trải đều.
2. `seed-courses.ts` — ~18-20 course ở mục 3 (sinh code bằng đúng logic `generateCourseCode` của BE), enrollment.
3. `seed-question-bank.ts` — câu hỏi đủ loại/trạng thái/độ khó cho từng course + version history (mục 4).
4. `seed-question-bank-duplicates.ts` — case trùng lặp (tách riêng vì tính chất đặc thù, dễ tắt/mở khi demo).
5. `seed-topics.ts` — topic + case tương đồng chủ đề.
6. `seed-exams.ts` — đề thi đủ trạng thái/chiến lược chấm (mục 5).
7. `seed-submissions.ts` — bài làm + chấm điểm đúng invariant (mục 6) — **file quan trọng nhất, review kỹ nhất**.
8. `seed-integrity.ts` — giám thị/tính toàn vẹn (mục 7).
9. `seed-grading-adjustments.ts` — regrade log/score adjustment (mục 6, phần cuối).

`seed-master.ts` gọi đúng thứ tự trên (mỗi bước chỉ phụ thuộc bước ngay trước, không nhảy cóc như hiện tại). `npm run db:rebuild`/`scripts/db-rebuild.sh` tiếp tục gọi `seed-master.ts`, không đổi entry point.

## 10. Kiểm thử trước khi coi là xong

- Chạy `db:rebuild` 2 lần liên tiếp trên local — xác nhận idempotent (không tăng số dòng ở lần 2).
- Query trực tiếp SQL xác nhận: không có `SubmissionAnswer` nào `isCorrect=true AND pointsAwarded IS NULL`; không có `ExamSubmission.status='GRADED'` nào còn `SubmissionAnswer` manual với `manualGradedAt IS NULL` thuộc cùng submission.
- Mở thử 3 màn đã báo bug (review câu hỏi, results, question-bank tạo câu hỏi) trên local sau khi seed, xác nhận không còn hiện tượng "0/1 điểm" hay "đã chấm nhưng vẫn X/X cần chấm" với data mới.
- Xác nhận các chart admin/lecturer analytics không rỗng và có hình dạng hợp lý (không phải 1 cột/1 điểm duy nhất).

## 11. Rủi ro / lưu ý triển khai

- Đây là thay đổi seed dùng cho **cả production** (qua Reset DB Zalo bot) — cần anh xác nhận rõ trước khi cho chạy `--force-reset` trên EC2 thật, giống quy trình đã làm lần trước (xem `SEED_DATA_ANALYSIS.md` mục 8.8).
- Đổi từ 36 → 20 sinh viên và đổi hết mã course sẽ **phá vỡ mọi ảnh chụp màn hình/demo cũ** đang tham chiếu ID/mã course hiện tại (ví dụ `91ad0ffb...` đang dùng để trace bug lần này sẽ không còn tồn tại sau reset) — nếu anh cần giữ lại 1 vài ID cụ thể cho tài liệu/slide đã chụp, nói trước để tôi cố định ID đó trong seed mới.
- Việc gán `pointsAwarded`/`manualGradedAt` đúng theo mục 1 khiến `seed-submissions.ts` phức tạp hơn nhiều so với bản cũ (phải giả lập cả bước "chấm tay" chứ không set điểm 1 lần) — đây là đánh đổi bắt buộc để không lặp lại bug đã tìm ra, không phải làm dư.

## 12. Đã chốt theo phản hồi của anh (khỏi hỏi lại)

1. ~~Legacy CLS001/DATNUO~~ → **Bỏ hẳn**, không giữ gì, kể cả các script phụ thuộc (`seed-course-question-banks.ts`, `seed-cls001-grade1-math.ts`, `verify-cls001-demo.ts`, `backfill-enrollments.ts`...).
2. ~~Mã course~~ → **Sinh bằng đúng logic `generateCourseCode` thật của BE** (mục 3.1), không tự đặt mã tuỳ ý.
3. ~~Tên course~~ → Tên hay, đúng ngữ cảnh CNTT, nhiều chủ đề (roster mục 3.2).
4. ~~Loại câu hỏi~~ → **Chỉ 7 loại** theo đúng UI thật (mục 4.0), không phải 9.
5. ~~Số câu hỏi~~ → Dao động, tối đa 100 câu/course (mục 4.1).
6. ~~Course riêng 7-loại cho lecturer01/student01~~ → đã thêm ở mục 3.3.
7. ~~Case "gian lận" & "làm quá nhanh" với 20 sinh viên~~ → **Không gộp tắt.** Tách riêng, xử lý như 2 tình huống tự nhiên độc lập (mục 2): cặp gian lận là `522h0019`/`522h0020`; "làm nhanh" là `522h0002` — 1 sinh viên khá-giỏi làm nhanh vì học kỹ, hoàn toàn không liên quan/không trộn với case gian lận. Vẫn giữ đúng 20 sinh viên.
8. ~~Thang độ khó~~ → Đã tự tra code (`toEditorDifficulty` chia /10 nếu giá trị >1) → **DB lưu số nguyên 1-10** (mục 4.1).
9. ~~`ExamLink`~~ → **Bỏ qua**, không seed.

## 13. Đã chốt hết

- Mục 8 (AI hỗ trợ) → **Bỏ qua**, không seed `AIGenerationRecord`/`ExamQualityReviewItem`. `seed-ai-assist.ts` ở mục 9 bị loại khỏi danh sách file.

Quy trình triển khai đã xác nhận: **chạy seed mới trên local trước → anh kiểm tra/duyệt → chạy thử trên production (không `--force-reset` vội, kiểm tra kỹ trước) → nếu mọi thứ ổn mới release version chính thức.**

---

Chờ anh trả lời mục 13, tôi sẽ chuyển sang viết code theo đúng cấu trúc file ở mục 9.
