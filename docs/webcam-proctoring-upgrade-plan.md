# Kế hoạch nâng cấp giám sát webcam / bằng chứng thi

> File theo dõi tiến độ triển khai — cập nhật trạng thái từng phần khi làm xong, để không mất ngữ cảnh giữa các phiên làm việc.
> Bối cảnh: dự án đang ở giai đoạn thử nghiệm/demo (bảo vệ đồ án), nên toàn bộ số lượng giới hạn ưu tiên nhỏ để tiết kiệm chi phí lưu trữ + AI, nhưng vẫn cho cấu hình được để sau này nới ra khi cần.

## Quy trình làm khi triển khai từng Part

1. Code xong 1 Part → chạy `mcp__codegraph__codegraph_status` để xác nhận index đã cập nhật (index tự cập nhật qua file watcher sau ~1 giây, bước này chỉ để chắc chắn trước khi trace/sửa Part tiếp theo dựa trên code mới).
2. Nếu Part đó sửa code dùng chung ở nhiều role (component/hook trong `FE/src/components`, `FE/src/hooks`, hoặc service/controller ở `BE/src`), chạy skill `/sync-role-screens` để kiểm tra và đồng bộ các màn hình admin/lecturer/student liên quan.
3. Đánh dấu `[x]` vào checklist tương ứng bên dưới, chỉ chuyển Part tiếp theo sau khi 2 bước trên xong.

## Quy ước icon

Toàn bộ icon minh họa trong UI (bảng, lưới ảnh, badge...) dùng **`lucide-react`** — thư viện icon đã dùng xuyên suốt dự án (ví dụ `Camera`, `Monitor`, `AlertTriangle`, `Shield`, `Eye`... đã xuất hiện sẵn trong `CreateExam.tsx`, `ExamMonitor.tsx`). **Không dùng emoji** (📷 🖥️ 🖼️ ⚠️...) trong bất kỳ đoạn code hay mockup nào — icon component nhất quán với phần còn lại của app, tránh trông rời rạc/không đồng bộ.

## Trạng thái tổng quan

- [x] Part 1 — Đổi label FE
- [x] Part 2 — Schema + cấu hình policy (Prisma)
- [x] Part 3 — Đa trigger phía client (ExamTaking.tsx)
- [x] Part 4 — Backend: giới hạn riêng từng loại + cooldown 60s + 5 mốc định kỳ
- [x] Part 5 — Screen-capture song song với webcam (bắt buộc "Toàn bộ màn hình")
- [x] Part 6 — Chuyển lưu trữ ảnh từ ổ đĩa EC2 sang Cloudflare R2
- [x] Part 7 — UI cấu hình cho giảng viên (CreateExam.tsx) + ghi chú "bản thử nghiệm"
- [x] Part 8 — Nâng cấp giao diện xem bằng chứng (lưới ảnh, ghép cặp webcam/màn hình, bộ lọc, cột tổng quan)
- [x] Part 9 — Thêm cột "Lượt" (attemptNo) vào trang Kết quả
- [ ] Part 10 — Kiểm thử tay (chạy thử 1 lượt thi đầy đủ)

---

## Cấu hình số liệu đã chốt (dùng làm giá trị mặc định)

| Tham số | Giá trị mặc định | Ghi chú |
|---|---|---|
| Giới hạn chụp — `tab_switch` | 3 | Đã có lớp "3 vi phạm = tự nộp bài" bảo vệ song song |
| Giới hạn chụp — `fullscreen_exit` | 3 | Tương tự |
| Giới hạn chụp — `paste_external` | 3 | Không có lớp bảo vệ nào khác |
| Giới hạn chụp — `mouse_idle` | 3 | Không có lớp bảo vệ nào khác |
| Chụp định kỳ (SCHEDULED) | 5 mốc: đầu — 25% — 50% — 75% — cuối | 1 đầu, 1 cuối, 3 mốc chia đều ở giữa |
| Cooldown giữa 2 lần chụp sự kiện | 60 giây | Giảm từ mặc định gốc 120s |
| Tổng tối đa lý thuyết | 5 + 3×4 = **17 lần chụp** → **34 ảnh** (mỗi lần chụp = 1 webcam + 1 màn hình) | |

Toàn bộ các số trên phải **cấu hình được theo từng đề thi** (không hard-code), có giá trị mặc định như bảng trên.

---

## Part 1 — Đổi label FE

**File:** `FE/src/features/lecturer/CreateExam.tsx`

- Vị trí hiện tại: dòng ~1616 — `<Label className="text-sm font-medium">Bằng chứng webcam cho bài lý thuyết</Label>`
- Đổi thành: `Ghi nhận bằng chứng giám sát trong khi thi`
- Lý do:
  - `examProfile` đang bị hard-code `"THEORY"` (dòng ~929) bất kể loại đề, nên chữ "cho bài lý thuyết" không phản ánh đúng logic thật — xem trace trong hội thoại trước.
  - Không đặt tên riêng theo "webcam" vì Part 5 sẽ thêm chụp màn hình song song — nếu giữ tên "webcam" thì lại sai/thiếu ngay khi Part 5 xong, lặp lại đúng lỗi đang sửa. Tên mới trung tính, bao trùm được cả webcam lẫn màn hình, không cần đổi tên lần nữa về sau.

---

## Part 2 — Schema + cấu hình policy (Prisma)

**File:** `BE/prisma/schema.prisma` (model `ProctoringEvidenceCapture`), và nơi định nghĩa `WebcamEvidencePolicy` trong `BE/src/submissions/proctoring-evidence.service.ts`

Việc cần làm:
- Mở rộng kiểu `WebcamEvidencePolicy` (hiện ở dòng 9-17 của `proctoring-evidence.service.ts`) để có thêm:
  - `eventCaptureLimits: { tab_switch: number; fullscreen_exit: number; paste_external: number; mouse_idle: number }` (thay cho `eventCaptureLimit` dùng chung 1 số)
  - `eventCooldownMs` giữ nguyên field nhưng đổi default còn 60_000
  - `scheduledCaptureOffsetsMs` — bật lại thay vì ép rỗng, tính theo % thời lượng bài thi (0%, 25%, 50%, 75%, 100%) nhân với `durationMinutes` truyền vào `normalizePolicy`
  - `requireFullScreenCapture: boolean` (để Part 5 dùng) + `screenCaptureEnabled: boolean`
- Thêm cột lưu loại nguồn ảnh trong `ProctoringEvidenceCapture`: `captureSource ProctoringEvidenceSource @default(WEBCAM)` (enum `WEBCAM | SCREEN`), vì giờ mỗi lần chụp tạo ra 2 bản ghi (webcam + screen) thay vì 1.
- Đổi giới hạn cứng `Math.min(5, ...)` ở dòng 55 hiện tại — bỏ giới hạn cứng "5", thay bằng validate theo từng loại dựa trên object `eventCaptureLimits` mới, mỗi loại validate riêng min 1 (không đặt giới hạn cứng tuyệt đối nữa, để giảng viên tự chịu trách nhiệm khi nới số).
- Chạy migration Prisma sau khi sửa schema.

---

## Part 3 — Đa trigger phía client

**File:** `FE/src/features/student/ExamTaking.tsx`, `FE/src/hooks/use-exam-security.ts`

Việc cần làm:
- Trong `recordViolation("tab_switch", ...)` (dòng ~430, ~457 của `use-exam-security.ts`) và nơi xử lý `fullscreen_exit` (dòng ~355, ~361): gọi thêm `requestWebcamEvidence("SUSPICIOUS_EVENT", { signals: ["tab_switch"] })` / `["fullscreen_exit"]` tương ứng — cần expose callback này ra ngoài hook hoặc gọi từ `ExamTaking.tsx` tại nơi consume sự kiện.
- Thêm phát hiện "dán nội dung ngoài" nếu chưa có sẵn hook riêng — kiểm tra lại xem cơ chế "paste không phải do copy trong bài" đã có ở đâu (đã nhắc tới lúc phân tích nhưng chưa trace code cụ thể — cần xác nhận lại vị trí trước khi sửa) → gọi `requestWebcamEvidence("SUSPICIOUS_EVENT", { signals: ["paste_external"] })` tại đó.
- `mouse_idle` giữ nguyên logic hiện tại (dòng 511-538), chỉ đổi ngưỡng cooldown dùng chung.
- `requestWebcamEvidence` (dòng 473-493) cần nhận thêm tham số loại nguồn để gọi song song cả webcam-capture và screen-capture (Part 5).

---

## Part 4 — Backend: giới hạn riêng từng loại + cooldown 60s + 5 mốc định kỳ

**File:** `BE/src/submissions/proctoring-evidence.service.ts`

Việc cần làm:
- `normalizePolicy()` (dòng 46-60): đổi cách tính `eventCaptureLimits` (object theo loại) thay vì 1 số chung; đổi `eventCooldownMs` default còn 60_000; tính lại `scheduledCaptureOffsetsMs` từ % duration thay vì ép `[]`.
- `requestCapture()` (dòng 77-146):
  - Nhánh `SUSPICIOUS_EVENT` (dòng 118-127): đổi điều kiện đếm `recentEvents` để lọc theo **đúng loại tín hiệu** (`triggerDetails.signals` chứa loại tương ứng) rồi so với `eventCaptureLimits[loại đó]`, thay vì so với 1 `eventCaptureLimit` dùng chung.
  - Nhánh `SCHEDULED` (dòng 86-117): logic hiện tại vốn đã hỗ trợ nhiều mốc — chỉ cần `scheduledCaptureOffsetsMs` có dữ liệu thật (từ Part 2) là chạy được, không cần sửa nhiều ở đây.
- Khi tạo capture, nếu `screenCaptureEnabled`, tạo thêm 1 bản ghi thứ 2 cùng `captureId`-group nhưng `captureSource: SCREEN` (xem Part 5 để thống nhất luồng request/finalize có 2 bước hay gộp 1 bước cho cả 2 ảnh).

---

## Part 5 — Screen-capture song song với webcam

**File:** `FE/src/features/student/ExamReadyCheck.tsx`, `FE/src/features/student/ExamTaking.tsx`, BE (Part 2, Part 4)

Việc cần làm:
- Thêm bước xin quyền chia sẻ màn hình ở `ExamReadyCheck.tsx`, song song với bước xin quyền webcam đã có (dòng ~163-180).
- Dùng `navigator.mediaDevices.getDisplayMedia({ video: true })`, sau khi có stream kiểm tra `track.getSettings().displaySurface === 'monitor'` — nếu khác `'monitor'`, dừng stream, báo lỗi, bắt chọn lại (giống pattern `handleWebcamUnavailable` đã có cho webcam, dòng 426-439 `ExamTaking.tsx`).
- Theo dõi mất kết nối chia sẻ màn hình tương tự webcam (`track.addEventListener("ended"...)`).
- Khi `requestWebcamEvidence` được gọi (Part 3), chụp thêm 1 frame từ stream màn hình theo cùng cơ chế canvas → base64 JPEG, gọi finalize riêng với `captureSource: SCREEN`.

---

## Part 6 — Chuyển lưu trữ ảnh sang Cloudflare R2

**File:** `BE/src/submissions/proctoring-evidence.service.ts`, tham khảo pattern đã có ở `BE/src/media/media.service.ts` (dòng 9, 39-60)

Việc cần làm:
- Import `S3Client`, `PutObjectCommand` từ `@aws-sdk/client-s3` giống `media.service.ts`.
- Thay đoạn ghi file local (`mkdir` + `writeFile`, dòng 162-165 hiện tại) bằng `PutObjectCommand` lên bucket R2, dùng chung biến môi trường `R2_*` đã có sẵn trong dự án (không cần thêm biến môi trường mới).
- Đổi tên đường dẫn lưu trữ (`storageKey`) sang dạng có ý nghĩa thay vì chỉ mã ngẫu nhiên, để dễ nhận biết khi xem trực tiếp trong bucket R2:
  ```
  proctoring-evidence/{examId}/{submissionId}/{loại-sự-kiện}_{nguồn}_{số-thứ-tự}.jpg
  vd: proctoring-evidence/exam123/sub456/tab_switch_webcam_02.jpg
  ```
  (mã ngẫu nhiên/hash vẫn giữ trong DB để chống đoán URL — chỉ đổi cách đặt tên phần đường dẫn hiển thị/lưu trữ).
- `getImagePath()`/luồng trả ảnh cho giảng viên (dòng 200-205): đổi từ đọc file local sang lấy presigned URL hoặc stream từ R2.
- `purgeExpired()` (dòng 214-222): đổi `rm()` (xóa file local) thành `DeleteObjectCommand` lên R2.
- Env var `PROCTORING_EVIDENCE_DIR` không còn cần thiết sau khi chuyển xong (giữ lại tạm thời để rollback dễ nếu cần).

---

## Part 7 — UI cấu hình cho giảng viên

**File:** `FE/src/features/lecturer/CreateExam.tsx`

Việc cần làm:
- Trong khối cấu hình "Bằng chứng webcam" (quanh dòng 1612-1622), thêm các ô nhập số cho: giới hạn chụp từng loại (4 ô), số mốc định kỳ (mặc định 5, có thể để cố định không cho sửa nếu muốn đơn giản UI), cooldown (giây).
- Thêm toggle "Bật chụp màn hình song song" (screen-capture).
- Thêm dòng ghi chú nhỏ dưới khối cấu hình:
  > *"Đây là phiên bản thử nghiệm nên số lần chụp bằng chứng được giới hạn thấp để tiết kiệm chi phí lưu trữ và phân tích AI."*
- Payload gửi lên `api.createExam()` (quanh dòng 927-933) cần thêm các field mới vào `webcamEvidencePolicy`.

---

## Part 8 — Nâng cấp giao diện xem bằng chứng

**File:** `FE/src/features/lecturer/ExamMonitor.tsx`, `FE/src/features/lecturer/ExamResultsList.tsx`

Giữ nguyên cơ chế hiện tại (bấm vào 1 sinh viên/1 cảnh báo mới mở dialog xem bằng chứng — không làm khu vực xem nhanh không cần bấm), chỉ nâng cấp **nội dung bên trong dialog** và thêm 1 cột tổng quan ở bảng danh sách. Tất cả icon dùng `lucide-react` theo đúng quy ước ở đầu file.

Việc cần làm:
- Đổi danh sách text đơn thuần bên trong dialog "Bằng chứng camera" (`ExamMonitor.tsx` quanh dòng 1276-1296) thành lưới ảnh thu nhỏ (thumbnail grid): mỗi ô có ảnh thật (không chỉ chữ) + icon `Camera` (nguồn webcam) hoặc `Monitor` (nguồn màn hình) + nhãn loại sự kiện cụ thể (Chuyển tab / Thoát fullscreen / Dán nội dung ngoài / Ngồi im / Định kỳ) thay cho nhãn chung "Chụp theo lịch"/"Chụp khi có tín hiệu" hiện tại (dòng 1292).
- Ghép cặp 2 ảnh cùng 1 lần chụp (webcam + màn hình) hiển thị cạnh nhau trong lưới, vì luôn được tạo ra cùng lúc theo cùng 1 lý do.
- Thêm bộ lọc nhanh phía trên lưới: Tất cả / Chỉ nghi vấn / Webcam / Màn hình / Chưa rà soát.
- Thêm 1 cột trong bảng danh sách sinh viên đang thi của `ExamMonitor.tsx` (bảng chính): số lượng ảnh bằng chứng + số ảnh chưa rà soát (dùng icon `ImageIcon`/`AlertTriangle` từ `lucide-react`), để giảng viên lướt toàn lớp không cần mở từng dialog.

---

## Part 9 — Thêm cột "Lượt" (attemptNo) vào trang Kết quả

**File:** `FE/src/features/lecturer/ExamResultsList.tsx`, `FE/src/lib/api.ts` (nếu `getExamSubmissions` chưa trả `attemptNo`)

Bối cảnh: trang Kết quả đã hiển thị đúng 1 dòng cho mỗi lượt làm (`filtered.map((s) => ...)`, dòng 812, key là submission id) và bấm vào từng dòng đã lấy đúng bằng chứng của lượt đó (`openIntegrityReview` → `api.getEvidenceCaptures(submission.id)`, dòng 367-377). Vấn đề duy nhất: bảng **không có cột nào ghi rõ "Lượt 1/2/3"**, nên nếu 1 sinh viên thi nhiều lần, các dòng trùng tên nhau mà không phân biệt được lượt nào là lượt mấy nếu không tự suy ra từ cột "Thời gian làm bài".

Việc cần làm:
- Xác nhận API `getExamSubmissions` đã trả về field `attemptNo` cho mỗi submission hay chưa — nếu chưa, bổ sung ở BE (`BE/src/exams/exams.service.ts` hoặc `submissions.service.ts` chỗ trả danh sách submissions cho giảng viên).
- Thêm 1 cột "Lượt" vào bảng ở `ExamResultsList.tsx` (quanh dòng 780-799 phần header, 819-855 phần thân bảng), hiển thị giá trị `s.attemptNo`.
- Cân nhắc gộp nhóm các dòng cùng 1 sinh viên lại gần nhau (sort theo `studentId` rồi `attemptNo`) thay vì để rải rác theo thứ tự trả về mặc định, để dễ nhìn ra các lượt của cùng 1 người.

---

## Part 10 — Kiểm thử tay

- [ ] Tạo 1 đề thi mới, bật đủ giám sát AI + bằng chứng webcam + screen-capture
- [ ] Vào thi bằng tài khoản sinh viên, xác nhận cả 2 bước xin quyền (webcam + màn hình) đều bắt buộc và từ chối đúng khi chọn sai loại chia sẻ màn hình
- [ ] Test từng trigger: chuyển tab, thoát fullscreen, dán nội dung ngoài, ngồi im ≥60s — xác nhận mỗi loại dừng đúng ở giới hạn đã cấu hình
- [ ] Xác nhận 5 mốc chụp định kỳ xuất hiện đúng theo % thời lượng
- [ ] Vào màn giám sát của giảng viên (`ExamMonitor.tsx`), xác nhận ảnh hiển thị được, phân biệt được webcam/màn hình, lưới ảnh + bộ lọc hoạt động đúng
- [ ] Vào trang Kết quả (`ExamResultsList.tsx`) với 1 sinh viên thi nhiều lượt, xác nhận cột "Lượt" hiển thị đúng và mỗi lượt ra đúng bằng chứng riêng
- [ ] Kiểm tra ảnh thực sự nằm trên R2 (không còn ghi vào `var/proctoring-evidence` trên EC2), tên file đúng quy ước mới
- [ ] Xác nhận sau khi hết hạn retention, purge job xóa đúng trên R2
