# Audit: Thẻ summary hiển thị điểm dạng % — đề xuất đổi sang thang 10

Phạm vi: màn kết quả (`ExamResultsList.tsx`), chấm bài (`ManualGradingDetail.tsx`, `GradingBreakdown.tsx`), monitor (`ExamMonitor.tsx`), và các nơi liên quan (PDF export, Analytics). Admin dùng chung 100% component với lecturer ở Results/Monitor (`admin/exam/[id]/results` và `admin/exam/[id]/monitor` chỉ re-export từ `features/lecturer/...`), nên sửa 1 chỗ là áp dụng cho cả 2 role.

**Chưa sửa gì — đây là tài liệu để bạn đọc và xác nhận trước.**

---

## 1. Phân loại: cái nào là "điểm" (nên đổi) vs cái nào là "tỷ lệ/phần trăm thật" (nên giữ %)

Trước khi liệt kê, cần phân biệt rõ 2 loại số liệu đang bị gộp chung dưới dạng "%":

- **Loại A — Điểm số** (average score, điểm cao nhất/thấp nhất, ngưỡng điểm đạt...): bản chất là điểm bài thi, quy đổi ra % chỉ để hiển thị — **nên đổi sang thang 10** theo yêu cầu của bạn.
- **Loại B — Tỷ lệ/phần trăm thật** (% sinh viên đạt, % hoàn thành, % câu đúng/sai/bỏ qua, % độ tin cậy AI, % tương đồng bài làm, % trừ điểm gian lận): đây là tỷ lệ trên một tập hợp (số người/số câu), không phải bản thân một điểm số — **có thể giữ nguyên %** vì đổi sang "/10" sẽ không có ý nghĩa (VD "70% sinh viên đạt" không thể là "7/10 sinh viên đạt").

Tôi đề xuất **chỉ đổi Loại A**, giữ nguyên Loại B. Bạn xác nhận lại ở mục 5 nếu muốn khác.

---

## 2. Danh sách cần đổi (Loại A — điểm số)

| # | Màn hình | File:line | Hiện tại | Đề xuất |
|---|---|---|---|---|
| 1 | Kết quả bài thi | `FE/src/features/lecturer/ExamResultsList.tsx:645-654` | Card "Phân bố điểm": `Trung bình: {avgScorePct}%`, `Cao nhất: {highestScorePct}%` | `Trung bình: X.X/10`, `Cao nhất: X.X/10` |
| 2 | Kết quả bài thi | `ExamResultsList.tsx:659` (chart) | Biểu đồ cột phân bố điểm, trục theo bin % (0-20, 21-40, 41-60, 61-80, 81-100) | Đổi bin sang thang 10: 0-2, 2-4, 4-6, 6-8, 8-10 |
| 3 | Monitor | `FE/src/features/lecturer/ExamMonitor.tsx:1846-1875` | Dialog "Phân bố điểm" — Trung bình/Cao nhất/Thấp nhất đã ở thang 10 nhưng dùng `Math.round()` → mất phần thập phân (hiển thị số nguyên 0-10) | Đổi sang `.toFixed(1)` hoặc `.toFixed(2)` cho nhất quán với các màn khác (không phải đổi thang, chỉ sửa làm tròn) |
| 4 | Monitor | `ExamMonitor.tsx:626` và `:1418` | Cảnh báo "Hoàn thành bất thường nhanh": `"...{timing.scorePct.toFixed(1)} điểm..."` — **bug nhãn sai**: biến `scorePct` là % (0-100, tính bằng `score*10`) nhưng đang gắn chữ "điểm" ngay sau, gây hiểu nhầm là điểm thang 10 hoặc thang 100 | Đổi hiển thị thành điểm thang 10 thật (`score.toFixed(1)/10`) thay vì in thẳng `scorePct` kèm chữ "điểm" |
| 5 | Xuất PDF kết quả | `BE/src/submissions/submissions.service.ts:5337` | `Điểm đạt: ${exam.passingScorePct}%` | `Điểm đạt: X.X/10` (xem mục 3 — cần chốt lại đơn vị `passingScore` trước) |
| 6 | Phân tích (Analytics) | `FE/src/features/lecturer/ExamAnalytics.tsx:498` | KPI card "Điểm trung bình": `{avgScorePct}%` | `{avgScorePct/10}/10` hoặc quy đổi tương ứng |
| 7 | Phân tích (Analytics) | `ExamAnalytics.tsx:849-850` | Bảng điểm theo nhóm: `<Progress value={avgScorePct}/>` + `{avgScorePct}%` | Đổi số hiển thị sang `/10`, thanh Progress vẫn có thể dùng % nội bộ (0-100) để vẽ độ dài, chỉ đổi CHỮ hiển thị |

---

## 3. Vấn đề cần chốt trước: `passingScore` đang được hiểu theo 3 nghĩa khác nhau trong BE

Đây là phát hiện quan trọng nhất, **ảnh hưởng trực tiếp tới việc đổi thang điểm ở mục 2.5** — nếu không thống nhất trước, "điểm đạt" sẽ hiển thị sai lệch giữa các màn.

`BE/prisma/schema.prisma:299`: `Exam.passingScore Int?` — không có ràng buộc/comment rõ đơn vị. Hiện có **3 cách hiểu khác nhau** đang tồn tại song song trong code:

| Nơi dùng | File:line | Cách hiểu `passingScore` |
|---|---|---|
| `exams.service.ts:1413-1414` | `scores.filter(s => s >= exam.passingScore)` | Điểm tuyệt đối, cùng thang với `totalPoints` của đề (không nhân/chia) |
| `submissions.service.ts:5090,5100-5101` (dùng cho PDF/CSV) | `percentage = finalScore*10; passed = percentage >= passingScorePct` | `passingScore` là % (0-100), so với điểm đã quy đổi thang 10 rồi nhân 10 |
| `submissions.service.ts:4450-4452` (dùng cho Analytics `passRate`) | `passingScore = exam.passingScore \|\| 50; passed = scorePct >= passingScore` | `passingScore` là % (0-100), so với `scorePct = score/totalPoints*100` |

Cách hiểu #2 và #3 tình cờ cùng là "%" nhưng **tính scorePct theo 2 công thức khác nhau** (`finalScore*10` giả định thang gốc là 10, còn `score/totalPoints*100` giả định thang gốc là `totalPoints` của đề) — nếu `totalPoints` của đề không đúng bằng 10 lần thang điểm thô, 2 công thức này cho ra kết quả khác nhau cho cùng 1 bài thi. Cách hiểu #1 lại hoàn toàn khác đơn vị (điểm tuyệt đối, không phải %).

**Cần bạn quyết định trước khi tôi sửa**: `passingScore` nên thống nhất lưu theo đơn vị nào?
- (a) Điểm tuyệt đối trên thang 10 (VD `5.0` nghĩa là phải đạt 5/10) — khớp với yêu cầu "thang điểm 10" của bạn, dễ hiểu nhất khi hiển thị UI.
- (b) Giữ nguyên là % (0-100) nhưng thống nhất 1 công thức tính `scorePct` duy nhất ở mọi nơi.

Nếu chọn (a), cần sửa đồng bộ cả 3 vị trí trên (không chỉ chỗ hiển thị PDF), và kiểm tra xem có dữ liệu Exam nào trong DB hiện tại đang lưu `passingScore` theo dạng % (VD giá trị 50, 70) hay theo điểm tuyệt đối (VD giá trị 5, 7) — **có thể ảnh hưởng dữ liệu đã có, cần bạn xác nhận trước khi đổi ý nghĩa field này** (đúng theo lưu ý bạn dặn ở lần trước).

---

## 4. Các nơi có "%" nhưng KHÔNG phải điểm số — đề xuất giữ nguyên (Loại B)

| Nơi | File:line | Ý nghĩa | Vì sao giữ % |
|---|---|---|---|
| "Tỷ lệ đạt" (PDF, tổng kết) | `submissions.service.ts:5339` | % số lượt nộp có `passed=true` trên tổng số lượt | Tỷ lệ người, không phải điểm |
| "Tỷ lệ đạt" (Analytics `passRate`) | `submissions.service.ts:4450-4453` | % số lượt đạt trên tổng | Tỷ lệ người |
| "Hoàn thành" (Analytics `completionRate`) | `submissions.service.ts:4500` | % số lượt hoàn thành trên tổng | Tỷ lệ người |
| Phân bố Đúng/Sai/Bỏ qua theo câu | `ExamAnalytics.tsx:823,827,831` | % số câu đúng/sai/bỏ qua | Tỷ lệ câu hỏi |
| Độ tin cậy gợi ý AI | `ManualGradingDetail.tsx:416,568` | % confidence của AI | Không phải điểm bài thi |
| Tương đồng bài làm | `ExamMonitor.tsx:1449,1893` | % giống nhau giữa 2 bài làm | Không phải điểm bài thi |
| % trừ điểm gian lận | `GradingBreakdown.tsx:218` | % điểm bị trừ do vi phạm | Là tỷ lệ trừ, không phải điểm tuyệt đối — có thể giữ % hoặc đổi hiển thị kèm số điểm bị trừ tuyệt đối (đã có sẵn `deductedScore` bên cạnh) |

---

## 5. Câu hỏi cần bạn xác nhận

1. Đồng ý cách phân loại Loại A (đổi) / Loại B (giữ) ở trên chứ, hay bạn muốn đổi luôn cả vài mục Loại B (VD "% trừ điểm gian lận" cũng muốn hiển thị khác)?
2. Với `passingScore` (mục 3): chọn phương án (a) chuẩn hoá về điểm tuyệt đối thang 10, hay (b) giữ % nhưng thống nhất công thức? Nếu chọn (a), bạn có biết dữ liệu Exam hiện tại trong DB đang nhập `passingScore` theo kiểu nào không (để tránh đổi ý nghĩa field làm sai lệch các đề đã tạo)?
3. Card biểu đồ phân bố điểm (mục 2.2) — đổi bin theo thang 10 (0-2, 2-4, 4-6, 6-8, 8-10) có ổn không, hay bạn muốn giữ nguyên số lượng bin/khoảng chia khác?
4. Xác nhận cho tiến hành sửa các mục 1-4, 6-7 ở bảng mục 2 trước (không phụ thuộc quyết định về `passingScore`), còn mục 5 (PDF "Điểm đạt") chờ quyết định mục 3 ở trên rồi làm sau?
