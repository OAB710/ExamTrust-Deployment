# Trace: luồng chấm điểm & công bố kết quả

Mục đích: trả lời câu hỏi — "Công bố kết quả ngay sau khi nộp" hiển thị điểm đã
chấm trước, rồi khi giảng viên chấm tự luận xong, refresh có tự cập nhật điểm
mới không? — và ghi lại toàn bộ luồng liên quan để kiểm tra lại khi cần.

## Trả lời ngắn

- **Không có tình huống "công bố khi tự luận chưa chấm xong"** — hệ thống chặn
  cả 2 đường công bố (tự động lúc nộp bài, và nút công bố thủ công) nếu bài
  thi còn câu tự luận chưa chấm.
- **Có** — sau khi đã công bố, nếu giảng viên **chấm lại** (regrade) một câu
  tự luận, điểm tổng được tính lại và lưu **ngay lập tức**. Sinh viên **refresh
  trang là thấy điểm mới ngay** — không cần "công bố lại", vì điểm luôn được
  đọc trực tiếp từ DB tại thời điểm request, không cache.

## 1. Nộp bài — điểm ban đầu được tính thế nào

`submitExam` (`BE/src/submissions/submissions.service.ts` ~dòng 1330-1367):

- Với mỗi câu trả lời: `pointsAwarded = autoGradable ? <điểm tính được> : null`.
  Câu tự luận/chấm tay khởi đầu là `null` (không phải 0), tức "chưa có điểm",
  không phải "0 điểm".
- `totalScore` = tổng `pointsAwarded` của tất cả câu (null tính như 0) →
  chuẩn hóa thành `submission.score`.
- Ngay sau đó, kiểm tra auto-publish:

  ```
  hasManualGrading = examQuestions.some(eq => !isAutoGradable(eq.type, eq.answerKey))
  if (!hasManualGrading && settings.showResultImmediately === true && !exam.resultsPublishedAt) {
    updateMany({ examId, resultsPublishedAt: null }, { resultsPublishedAt: now })
  }
  ```

  → **Chỉ tự công bố nếu bộ câu hỏi của CHÍNH bài làm này không có câu nào
  cần chấm tay.** Nếu có câu tự luận, nhánh này bị bỏ qua hoàn toàn — dù
  switch "Công bố kết quả ngay sau khi nộp" đang bật.

  ⚠️ **Lưu ý cạnh (edge case):** `hasManualGrading` ở đây được tính trên
  **bộ câu hỏi của riêng học sinh đang nộp** (`examQuestions` của instance này),
  không phải trên toàn bộ đề gốc. Nếu đề dùng **chọn câu hỏi ngẫu nhiên theo
  học sinh** và có trộn cả câu tự luận + câu tự động chấm trong pool, một học
  sinh "May mắn" bốc trúng toàn câu tự động chấm sẽ khiến `resultsPublishedAt`
  của CẢ ĐỀ bị set sớm (vì `updateMany` theo `examId`, ảnh hưởng toàn đề) —
  trong khi học sinh khác (bốc trúng câu tự luận) có thể chưa nộp hoặc đang
  chờ chấm. Cần test riêng nếu đề dùng random-per-student kèm câu tự luận
  trong pool.

## 2. Chấm tay 1 câu tự luận

`gradeAnswer` (~dòng 2630-2746):

1. Update `pointsAwarded`, `manualGradedAt`, `feedback` cho `SubmissionAnswer` đó.
2. Ghi `ExamSubmissionRegradeLog` nếu điểm/feedback thay đổi so với trước (audit
   trail cho việc chấm lại).
3. Gọi `recalculateSubmissionScore(submissionId)` — **luôn chạy, mỗi lần chấm**:
   - Tính lại `rawScore` = tổng `pointsAwarded` của toàn bộ câu trong submission.
   - Ghi lại `ExamSubmission.score` (chuẩn hóa) **ngay trong transaction đó**.
   - Cập nhật `status`: `GRADED` nếu không còn câu tự luận nào pending, ngược
     lại vẫn `SUBMITTED`.

→ **Điểm tổng của submission được cập nhật tức thời mỗi lần chấm 1 câu**, không
chờ "chấm hết mới tính lại 1 lần".

## 3. Công bố kết quả thủ công (nút "Công bố kết quả")

`publishExamResults` (~dòng 3464-3562), dựa trên `getManualGradingStatus`
(~dòng 3125-3219):

- `hasManualGrading` ở đây tính trên **toàn bộ submission đã nộp** của đề
  (không phải riêng 1 học sinh) — nếu tổng số câu tự luận (`manualTotal`) > 0.
- Nếu đề **không** có câu tự luận nào ở bất kỳ submission nào → công bố ngay,
  không cần điều kiện gì thêm.
- Nếu **có** câu tự luận:
  ```
  canPublish = submissions.length > 0 && !published && manualTotal === manualGraded
  ```
  → **Chặn cứng**: chỉ cho công bố khi 100% câu tự luận của **tất cả** bài đã
  nộp đã được chấm. Nếu chưa, ném lỗi 400: *"Cần chấm điểm tất cả các câu tự
  luận trước khi công bố kết quả."*
- Khi được phép công bố: tính lại điểm cho **tất cả** submission liên quan
  (bulk), set `status: GRADED`, `gradedAt`, rồi mới set `exam.resultsPublishedAt`.

→ Do 2 lớp chặn này (auto-publish bỏ qua nếu có tự luận trong bộ câu hỏi của
học sinh; nút công bố thủ công chặn nếu còn tự luận pending), **về lý thuyết
không thể có trạng thái "đã công bố nhưng còn tự luận chưa chấm"** — trừ
edge case random-per-student ở mục 1.

## 4. Hiển thị điểm cho sinh viên — có cache không?

`sanitizeStudentSubmissionView` (~dòng 516-575) và các endpoint tương tự
(~dòng 5040, 5104...):

```
canShowScore = Boolean(exam.resultsPublishedAt) && (afterReview?.showScore ?? true)
...
score: canShowScore ? submission.score : null
```

- Đọc **trực tiếp** `exam.resultsPublishedAt` và `submission.score` từ DB mỗi
  lần gọi API — **không có tầng cache** giữa BE và FE cho giá trị này.
- Vậy: nếu giảng viên **regrade** một câu (sau khi đã công bố — `gradeAnswer`
  không kiểm tra `resultsPublishedAt`, có thể gọi bất cứ lúc nào), điểm mới
  được lưu ngay (mục 2), và lần fetch tiếp theo từ FE (refresh trang, hoặc nút
  "Làm mới" ở `GradingBreakdown.tsx`) sẽ trả về điểm mới đó ngay lập tức.
- Không cần "công bố lại" (`publishExamResults`) sau 1 lần regrade — vì điểm
  hiển thị luôn tính theo trạng thái DB hiện tại, không phải snapshot lúc
  công bố.

## 5. Đề xuất: hiển thị "điểm tạm tính" khi còn tự luận chưa chấm (CHƯA triển khai)

**Vấn đề hiện tại:** khi bật "Công bố kết quả ngay sau khi nộp" nhưng bài thi
có câu tự luận, sinh viên **không thấy gì cả** (`score: null`) cho đến khi
giảng viên chấm hết tự luận và bấm công bố thủ công — dù phần câu tự động
chấm đã có điểm ngay từ lúc nộp. Muốn đổi thành: sinh viên thấy ngay điểm của
các câu đã tính được, kèm nhãn rõ "chưa chính thức — còn N câu tự luận chưa
chấm".

**Nguyên tắc thiết kế đề xuất — KHÔNG đụng vào `resultsPublishedAt`:**
`resultsPublishedAt` nên tiếp tục giữ đúng nghĩa "công bố chính thức" (mở đáp
án, đúng/sai, phản hồi — theo `reviewSettings`). Điểm tạm tính là một khái
niệm **độc lập, hẹp hơn**: chỉ lộ **số điểm tổng của phần tự động chấm**, tuyệt
đối không kèm đáp án/đúng-sai/giải thích của từng câu (giữ nguyên rủi ro lộ đề
đã throttle ở các bước trước trong luồng này). Vì vậy nên tách thành 1 field
mới, không tái dùng `canShowScore`/`score` hiện có (2 field đó gắn chặt với
`resultsPublishedAt`).

**Điều kiện hiển thị điểm tạm tính (đề xuất):**
```
showProvisionalScore =
  submitSettings.showResultImmediately === true &&
  !exam.resultsPublishedAt &&        // chưa công bố chính thức
  submission có ít nhất 1 câu autoGradable
```
Điểm tạm tính = tổng `pointsAwarded` của **riêng các câu autoGradable**
(không cộng câu tự luận, vì đang là `null`) / tổng điểm tối đa của **riêng các
câu autoGradable** — quy đổi theo cùng công thức `normalizeScore` hiện có,
nhưng tính trên tập con câu hỏi, không phải toàn bài.

**Việc cần sửa (để biết phạm vi khi triển khai thật):**

- **BE — `submissions.service.ts`**
  - Thêm 1 method tính điểm tạm tính (tách riêng phần auto-gradable), dùng lại
    logic `isAutoGradable`/`normalizeScore` đã có, không viết lại từ đầu.
  - `sanitizeStudentSubmissionView` (~dòng 516): thêm field mới vào object trả
    về, ví dụ `provisionalScore: number | null` và `pendingManualCount: number`
    — tính **độc lập** với `canShowScore`, không thay `score` (giữ `score: null`
    khi chưa công bố chính thức, tránh 2 khái niệm lẫn vào nhau ở FE).
  - `getMySubmissionById` / `getMyExamSubmission` / các hàm list kết quả tương
    tự (~dòng 5040, 5104) đang tự tính `canShowScore` riêng, không đi qua
    `sanitizeStudentSubmissionView` — cần rà lại từng chỗ để field mới nhất
    quán ở mọi endpoint sinh viên gọi tới, không chỉ 1 chỗ.
  - Cân nhắc: có cần audit log gì cho việc "sinh viên đã xem điểm tạm tính"
    không? (không bắt buộc, nhưng nếu điểm tạm tính lệch nhiều so với điểm
    chính thức sau chấm, có thể cần biết sinh viên đã thấy số cũ).

- **FE — `GradingBreakdown.tsx`** (`/student/grading`)
  - Thêm nhánh hiển thị khi `provisionalScore != null && !resultsPublished`:
    banner rõ ràng "Điểm tạm tính — chưa chính thức, còn {pendingManualCount}
    câu tự luận chưa chấm", tách biệt khỏi khối "Điểm cuối cùng"/"Điểm tạm
    tính" hiện tại (khối đó vốn đang so theo `gradingComplete`, tương tự nhưng
    KHÔNG giống điều kiện mới này — cần đối chiếu kỹ để không nhầm 2 loại
    "tạm tính": (a) tạm tính vì giảng viên chưa chấm xong dù đã publish, vs
    (b) tạm tính vì hoàn toàn chưa publish).
  - Ẩn hẳn bảng đáp án đúng/giải thích như hiện tại (không đổi phần đó).

- **FE — danh sách kết quả của sinh viên** (route xem điểm tổng hợp nhiều bài
  thi, nếu có màn riêng ngoài `GradingBreakdown`) — cần thêm badge tương tự để
  sinh viên phân biệt được "tạm tính" vs "chính thức" ngay ở danh sách, không
  chỉ khi vào xem chi tiết.

- **Đổi copy ở CreateExam.tsx**: nếu triển khai, nhãn "Công bố kết quả ngay sau
  khi nộp" và mô tả ở [CreateExam.tsx:1804-1810](../FE/src/features/lecturer/CreateExam.tsx#L1804-L1810)
  không còn đúng 100% nữa — switch giờ có 2 tác dụng (công bố chính thức nếu
  không có tự luận; HOẶC hiện điểm tạm tính nếu có tự luận). Cần viết lại mô
  tả cho khớp, có thể đổi tên switch (ví dụ "Cho xem điểm ngay khi nộp (tạm
  tính nếu còn tự luận)").

**Câu hỏi mở cần quyết định trước khi code:**
1. Điểm tạm tính có tính luôn cả **điều chỉnh gian lận** (`scoreAdjustments`)
   không, hay chỉ thuần điểm auto-graded? (Đề xuất: không — điều chỉnh gian lận
   thường xử lý sau, gắn vào lúc công bố chính thức.)
2. Có cần thông báo (notification/toast) cho sinh viên khi điểm chuyển từ
   "tạm tính" → "chính thức" không, hay chỉ cần refresh là thấy?
3. Điểm tạm tính có nên tính theo `reviewSettings.phases.after.showScore`
   không, hay luôn hiện bất kể cấu hình đó (vì nó không phải "sau khi có kết
   quả chính thức")? Đề xuất: tách biệt hoàn toàn khỏi `reviewSettings` — đó
   là cấu hình cho giai đoạn "đã công bố", còn đây là giai đoạn "chưa công
   bố nhưng có xem trước".

## Việc cần kiểm tra thêm khi test luồng chấm bài

1. **Regrade sau khi đã công bố**: chấm lại 1 câu tự luận đã published →
   refresh trang kết quả sinh viên → xác nhận điểm mới hiện đúng, không cần
   hành động nào khác từ giảng viên.
2. **Edge case random-per-student + câu tự luận trong pool**: tạo đề chọn câu
   hỏi ngẫu nhiên theo học sinh, pool có cả tự luận và tự động chấm, bật
   "Công bố kết quả ngay sau khi nộp" → cho 1 học sinh bốc trúng toàn câu tự
   động chấm nộp bài trước → kiểm tra `exam.resultsPublishedAt` có bị set sớm
   không, ảnh hưởng gì tới học sinh khác đang có câu tự luận chưa chấm.
3. **Nút "Công bố kết quả" khi còn tự luận pending**: xác nhận đúng bị chặn với
   thông báo lỗi rõ ràng, không công bố được nửa chừng.
4. **Trạng thái `SUBMITTED` → `GRADED`**: xác nhận status chuyển đúng ngay khi
   câu tự luận cuối cùng của 1 submission được chấm (qua `recalculateSubmissionScore`,
   độc lập với việc đề đã publish hay chưa).
