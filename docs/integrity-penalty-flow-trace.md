# Trace: luồng trừ điểm do vi phạm toàn vẹn (integrity penalty)

Mục đích: trả lời câu hỏi — khi giảng viên bấm "Xác nhận và áp dụng" ở dialog
"Xác nhận cần xử lý vụ việc" (theo %, hay trừ thẳng điểm), hệ thống đang trừ
điểm như thế nào, công thức tính ra sao, và kết quả trừ đó có thực sự phản ánh
ở những màn hình nào hiển thị điểm cho sinh viên/giảng viên.

## 1. UI — `IntegrityCaseDetail.tsx`

Dialog "Xác nhận cần xử lý vụ việc" ([IntegrityCaseDetail.tsx:926-961](../FE/src/components/admin/IntegrityCaseDetail.tsx#L926-L961)):

- Checkbox "Hiệu chỉnh điểm của sinh viên" (`applyPenalty`) — không tick thì
  chỉ xác nhận vụ việc, không đụng điểm.
- Khi tick, chọn 1 trong 2 chế độ (`penaltyMode`):
  - **Theo phần trăm** (`PERCENT`): chọn 1 trong 4 mốc cố định `10/25/50/100`
    (`deductionPercent`).
  - **Trừ thẳng điểm** (`FIXED`): nhập số điểm trừ trực tiếp trên thang 10
    (`penaltyAmount`, input tự do, `min 0.01 max 10 step 0.01`).
- Preview điểm ngay trong dialog ([IntegrityCaseDetail.tsx:416-422](../FE/src/components/admin/IntegrityCaseDetail.tsx#L416-L422)) tính y hệt công thức BE (xem mục 2):
  ```
  academicScore = submission.academicScore ?? submission.integrityReview?.academicScore ?? 0
  deductedScore = FIXED ? min(academicScore, penaltyAmount) : academicScore * deductionPercent / 100
  finalScore   = max(0, academicScore - deductedScore)
  ```
- Bấm "Xác nhận và áp dụng" → gọi `onReview('CONFIRMED', notes, deductionPercent, applyPenalty, penaltyMode, penaltyAmount)`
  → `IntegrityOverview.tsx`'s `reviewCase` → `api.reviewIntegrityCase(submissionId, {...})`
  → `PATCH` tới BE `reviewIntegrityCase`.

⚠️ **Lưu ý cạnh (edge case) ở bước preview:** `submission.academicScore` mà
dialog dùng để preview đến từ response của `getIntegrityCases` (danh sách),
nơi field này được gán cứng là **điểm gốc chưa cộng `scoreAdjustments`**
([submissions.service.ts:2343](../BE/src/submissions/submissions.service.ts#L2343)
— `academicScore: this.toNumber(session.submission?.score, 0)`). Trong khi đó,
công thức thật ở BE (mục 2) dùng `academicScore = submission.score +
activeAdjustmentTotal` (đã cộng điều chỉnh điểm chung). Nếu bài nộp có
`ScoreAdjustment` đang hiệu lực, số hiển thị preview trong dialog có thể
**lệch** với số BE thực sự dùng để tính trừ — không sai kết quả cuối (BE vẫn
tính đúng), chỉ preview trên UI trước khi bấm có thể không khớp 100%.

## 2. BE — `reviewIntegrityCase` (nơi tính và lưu trừ điểm)

[submissions.service.ts:2459-2574](../BE/src/submissions/submissions.service.ts#L2459-L2574)

```
academicScore = clamp(submission.score + Σ(scoreAdjustments đang hiệu lực), 0, 10)   // làm tròn 2 số

nếu applyPenalty:
  penaltyMode = 'FIXED' hoặc 'PERCENT' (theo lựa chọn)
  PERCENT → penaltyPercent = 10/25/50/100 (bắt buộc chọn 1 trong 4)
            deductedScore  = academicScore * penaltyPercent / 100
  FIXED   → penaltyAmount  = số điểm nhập (0 < x ≤ 10, bắt buộc)
            deductedScore  = min(academicScore, penaltyAmount)   // không cho âm điểm

  finalScore = max(0, academicScore - deductedScore)
```

Kết quả được **upsert vào bảng `IntegrityReview`** (`penaltyMode`,
`penaltyPercent`, `penaltyAmount`, `academicScore`, `deductedScore`,
`finalScore`, `penaltyAppliedAt`) — **không** đụng vào `ExamSubmission.score`
(điểm gốc giữ nguyên vĩnh viễn). Đồng thời ghi 1 dòng
`IntegrityReviewAudit` làm audit trail (action `PENALTY_APPLIED` /
`PENALTY_FIXED_APPLIED` / `PENALTY_UPDATED` / ... tuỳ tình huống).

**Validate trước khi cho xác nhận** (dòng 2474-2484):
- Bắt buộc có ghi chú (`notes`) khi `status = CONFIRMED`.
- PERCENT: bắt buộc `deductionPercent` là 1 trong `10/25/50/100`.
- FIXED: bắt buộc `0 < penaltyAmount ≤ 10`.

**Kiểm chứng công thức bằng đúng số liệu trong ảnh chụp màn hình đã gửi
trước đó:** `academicScore = 3.85`, chọn `10%` → `deductedScore = 3.85 × 0.10
= 0.385 ≈ -0.39` (hiển thị) → `finalScore = 3.85 - 0.39 = 3.46` — khớp chính
xác với UI (`3.46 / 10`). Công thức đúng.

### Giữ/xoá penalty khi review lại (dòng 2497-2508)

- Đổi trạng thái sang `REVIEWED` mà vụ việc **đã** từng bị `CONFIRMED` kèm
  penalty trước đó → **giữ nguyên** penalty cũ (không xoá).
- Xác nhận lại `CONFIRMED` nhưng **không tick** `applyPenalty` lần này, trong
  khi đã có penalty cũ → **giữ nguyên** penalty cũ (không tự động gỡ). Đây là
  hành vi cố ý ("giữ trạng thái trừ điểm trừ khi chủ động đổi"), nhưng dễ gây
  hiểu lầm cho giảng viên là "tôi bỏ tick rồi thì chắc điểm được khôi phục" —
  thực tế thì không.
- Đổi sang `DISMISSED` (loại trừ vụ việc) → penalty bị **thu hồi hoàn toàn**
  (`penaltyMode = null`), log action `PENALTY_REVOKED`.

### Đồng bộ lại khi điểm gốc/điều chỉnh thay đổi sau đó

`refreshIntegrityScoreAfterAdjustment` ([submissions.service.ts:3416-3438](../BE/src/submissions/submissions.service.ts#L3416-L3438))
được gọi mỗi khi giảng viên **tạo mới** hoặc **thu hồi** một `ScoreAdjustment`
chung (không liên quan tới integrity) — tính lại `deductedScore`/`finalScore`
theo `penaltyMode` đã lưu, dựa trên điểm gốc + tổng điều chỉnh mới nhất. Nhờ
vậy nếu giảng viên cộng/trừ điểm thủ công sau khi đã áp dụng penalty, số tiền
phạt (theo % hoặc theo điểm cố định) tự khớp lại theo điểm nền mới.

## 3. ⚠️ Phát hiện quan trọng: hầu hết màn hình hiển thị điểm KHÔNG áp dụng
   penalty này

Đây là phần cần lưu ý nhất. `IntegrityReview.finalScore` (điểm sau khi trừ
gian lận) **chỉ được 1 endpoint duy nhất sử dụng** để ghi đè vào điểm hiển
thị. Tất cả những nơi khác vẫn hiển thị `submission.score + scoreAdjustments`
(bỏ qua hoàn toàn phần trừ gian lận), khiến điểm hiển thị **không nhất quán**
tuỳ theo màn hình đang xem.

| Endpoint / hàm BE | Dùng bởi (FE) | Có áp dụng `integrityReview.finalScore`? |
|---|---|---|
| `getMyResultsHistory` ([:5104](../BE/src/submissions/submissions.service.ts#L5104), field `integrityFinalScore`/`effectiveScore` dòng 5149-5153) | `StudentResults.tsx` (danh sách nhóm theo đề, mỗi đề nhiều lượt) | ✅ **Có** — khi `status === CONFIRMED`, override hẳn `score` bằng `finalScore` |
| `sanitizeStudentSubmissionView` ([:518](../BE/src/submissions/submissions.service.ts#L518)) | `GradingBreakdown.tsx` (`/student/grading`) — dùng bởi `getMyExamSubmission` & `getMySubmissionById` | ❌ **Không** — chỉ `academicScore + adjustmentTotal`. Trang này **có** card riêng "Điều chỉnh điểm do gian lận" đọc thẳng `submission.integrityReview.finalScore` để hiển thị, nhưng khối card "Tổng quan điểm"/"Điểm cuối cùng" phía trên lại **không** dùng số đó — tự tính lại từ tổng điểm từng câu, nên 2 khối trên **cùng 1 trang** có thể cho ra 2 con số khác nhau khi có penalty (khối trên chưa trừ, khối "Điều chỉnh điểm do gian lận" bên dưới mới có số đã trừ) |
| `findByStudent` ("my-submissions" list, [:5034](../BE/src/submissions/submissions.service.ts#L5034)) | (danh sách bài đã nộp — nếu có màn dùng endpoint này) | ❌ **Không** — cùng công thức `score + adjustmentTotal`, integrityReview.finalScore chỉ được set `null` khi chưa công bố, không override khi CONFIRMED |
| `findByExam` ([:2888](../BE/src/submissions/submissions.service.ts#L2888)) | `ExamResultsList.tsx` — **bảng kết quả chính giảng viên xem** (`formatScoreOnTen(s.score)`) | ❌ **Không** — không hề fetch `integrityReview` trong include, cột điểm hiển thị cho giảng viên hoàn toàn không phản ánh việc đã xác nhận trừ điểm gian lận |
| `getExamOverview` ([:3841](../BE/src/submissions/submissions.service.ts#L3841)) | `ExamResultsList.tsx` (thẻ trung bình/cao nhất/thấp nhất) | ❌ **Không** — submissions select không có `integrityReview`, thống kê lớp học hoàn toàn dựa trên điểm gốc |
| `getExamResultsExportData` ([:5357](../BE/src/submissions/submissions.service.ts#L5357), dùng chung cho CSV & PDF export) | Nút "Xuất CSV"/"Xuất PDF" ở `ExamResultsList.tsx` | ⚠️ **Nửa vời** — có fetch `integrityReview.status`/`penaltyPercent` và xuất ra 2 cột riêng `integrityStatus`/`integrityPenaltyPercent`, nhưng cột **`finalScore`/`percentage`/`passed`** (đậu/rớt!) trong file xuất **vẫn tính từ điểm chưa trừ gian lận** — nghĩa là 1 sinh viên đã bị xác nhận gian lận và trừ điểm xuống dưới điểm đạt vẫn có thể hiện `passed = true` trong file CSV/PDF xuất ra |

**Bug cụ thể phát hiện thêm ở `GradingBreakdown.tsx`:** card "Điều chỉnh điểm
do gian lận" chỉ hiện khi
```ts
submission?.integrityReview?.status === 'CONFIRMED' && submission?.integrityReview?.penaltyPercent
```
([GradingBreakdown.tsx:214](../FE/src/features/student/GradingBreakdown.tsx#L214)).
Với chế độ **FIXED** (trừ thẳng điểm), `penaltyPercent` luôn là `null` (BE chỉ
set `penaltyPercent` khi `penaltyMode === 'PERCENT'`) — nghĩa là **sinh viên
bị trừ thẳng điểm sẽ không bao giờ thấy card giải thích vì sao điểm bị trừ**,
dù điểm cuối họ thấy (nếu endpoint đó có áp dụng finalScore) đã bị trừ rồi.
Điều kiện đúng phải kiểm tra `penaltyMode` có tồn tại (hoặc `deductedScore > 0`)
thay vì riêng `penaltyPercent`.

**`StudentResults.tsx` hoàn toàn im lặng:** dù `getMyResultsHistory` có
override đúng `finalScore`, trang này không hề hiển thị bất kỳ badge/ghi chú
nào cho biết điểm đã bị điều chỉnh do vi phạm — sinh viên chỉ thấy 1 con số
thấp hơn mong đợi mà không rõ lý do.

**Tóm lại:** penalty được lưu đúng, công thức tính đúng, nhưng **chỉ 1/6
điểm-hiển-thị-điểm trong app thực sự đọc nó** (`getMyResultsHistory`), và
ngay cả nơi có đọc đúng cũng không giải thích rõ cho sinh viên. Muốn sinh
viên và giảng viên luôn thấy đúng điểm cuối cùng ở mọi nơi, cần sửa 5 chỗ
còn lại để cũng ưu tiên `integrityReview.finalScore` khi
`status === 'CONFIRMED'`, sửa điều kiện hiện card ở `GradingBreakdown.tsx`,
và thêm ghi chú ở `StudentResults.tsx` (không sửa gì lúc này, chỉ ghi nhận
để quyết định sau).

## 4. Đề xuất hiển thị khi áp dụng phạt lúc bài **chưa chấm xong** / đề **đã
   công bố** — xét đủ các trường hợp

### 4.1 Vì sao đây là trường hợp cần xử lý riêng, không chỉ là 1 case

`academicScore` dùng để tính `deductedScore`/`finalScore` trong
`reviewIntegrityCase` được lấy **tại đúng thời điểm giảng viên bấm xác
nhận**: `submission.score` (đã chốt) `+ scoreAdjustments` đang hiệu lực. Nếu
bài đó **còn câu tự luận chưa chấm**, `submission.score` lúc này mới chỉ là
điểm của phần **tự động chấm** (câu tự luận đóng góp `pointsAwarded = null`
→ tính như 0 trong `recalculateSubmissionScore`,
[submissions.service.ts:2639-2646](../BE/src/submissions/submissions.service.ts#L2639-L2646)).

→ Phạt được tính trên một **điểm nền tạm/thiếu**, không phải điểm cuối cùng.

Sau đó, khi giảng viên chấm nốt câu tự luận, `recalculateSubmissionScore`
cập nhật lại `submission.score` cho đúng — **nhưng không hề gọi lại**
`refreshIntegrityScoreAfterAdjustment` (hàm đó **chỉ** được gọi từ
`createScoreAdjustment`/`revokeScoreAdjustment`, không được gọi từ
`gradeAnswer`/`recalculateSubmissionScore`, và cũng không được gọi từ
`publishExamResults` khi hàm này ghi đè `submission.score` hàng loạt lúc
công bố — xem [publishExamResults:3503-3592](../BE/src/submissions/submissions.service.ts#L3503-L3592)).

→ **Kết quả:** `IntegrityReview.academicScore/deductedScore/finalScore` bị
**đóng băng** ở giá trị lúc mới xác nhận, dù điểm nền thật đã tăng lên sau
khi chấm xong hoặc sau khi công bố. Đây là gốc rễ kỹ thuật của câu hỏi —
không chỉ là "hiển thị sao cho đẹp", mà số liệu bên dưới thực sự có thể sai
lệch nếu không refresh.

### 4.2 Các trường hợp thực tế có thể xảy ra (ma trận trạng thái)

Trục 1 — **chấm bài** của chính bài nộp đang xét: `G0` = còn câu tự luận
chưa chấm, `G1` = đã chấm xong toàn bộ.
Trục 2 — **công bố** của đề: `P0` = chưa công bố, `P1` = đã công bố.

> Lưu ý: theo edge case đã ghi ở `grading-publish-flow-trace.md` mục 1, với
> đề dùng **chọn câu hỏi ngẫu nhiên theo học sinh**, `exam.resultsPublishedAt`
> có thể bị set sớm do một bạn khác "bốc" trúng toàn câu tự động chấm nộp
> trước — nên **`G0 + P1` là có thể xảy ra thật**, không chỉ lý thuyết.

| # | Chấm bài | Công bố | Khi nào xảy ra | Rủi ro dữ liệu |
|---|---|---|---|---|
| A | `G0` | `P0` | Giảng viên xác nhận phạt ngay khi vừa thấy tín hiệu bất thường, chưa kịp chấm tự luận | Phạt tính trên điểm nền thiếu; sẽ lệch khi chấm xong |
| B | `G0` | `P1` | Edge case random-per-student — đề đã công bố (do bạn khác) nhưng bài này vẫn còn tự luận chưa chấm | Sinh viên có thể đã thấy `resultsPublishedAt` khác null → tưởng điểm là cuối cùng, nhưng thực ra vừa thiếu phần tự luận vừa có phạt tính sai |
| C | `G1` | `P0` | Đã chấm xong, đủ điều kiện công bố nhưng giảng viên chưa bấm | Nếu phạt áp dụng **sau khi** G1 thì đúng; nếu phạt áp dụng **từ lúc còn G0** rồi mới chấm xong thì vẫn đóng băng sai như case A |
| D | `G1` | `P1` | Trạng thái "sạch" cuối cùng | Chỉ đúng nếu phạt được áp dụng (hoặc refresh lại) sau khi đã ở G1 |

Nhận xét: cột quyết định thật sự không phải "G/P hiện tại" mà là **"phạt được
áp dụng ở thời điểm G0 hay G1"** — vì integrity không tự refresh theo grading.
Cả 4 dòng trên đều có thể mang dữ liệu sai nếu phạt bấm lúc còn `G0`.

### 4.3 Đề xuất sửa gốc rễ (backend) — làm trước, UI mới có ý nghĩa

Không có refresh, mọi đề xuất UI bên dưới chỉ là "trang trí" trên số liệu có
thể sai. Đề xuất bổ sung **1 điểm gọi hàm**, tái dùng logic đã có
(`refreshIntegrityScoreAfterAdjustment`), không viết lại:

- Gọi `refreshIntegrityScoreAfterAdjustment(tx, submissionId, submission.score)`
  ngay sau khi `recalculateSubmissionScore` cập nhật `score` xong (mỗi lần
  `gradeAnswer` chấm 1 câu tự luận).
- Gọi tương tự (dạng batch) trong `publishExamResults`, ngay sau vòng
  `$transaction` cập nhật `score` hàng loạt lúc công bố.
- Vì hàm này tự early-return nếu `review.penaltyMode` là `null`
  ([:3418-3419](../BE/src/submissions/submissions.service.ts#L3418-L3419)),
  gọi thêm ở 2 chỗ này **hoàn toàn an toàn** cho các submission không có
  penalty — không tốn chi phí đáng kể, không đổi hành vi hiện có.

Sau khi có refresh tự động, `academicScore`/`deductedScore`/`finalScore` của
`IntegrityReview` **luôn phản ánh điểm nền mới nhất** — case A/B/C ở trên tự
động hội tụ về đúng như case D theo thời gian, không cần giảng viên phải nhớ
quay lại "áp dụng lại phạt" thủ công.

### 4.4 Đề xuất hiển thị UI theo từng vai trò (sau khi đã có refresh ở 4.3)

**A. Phía giảng viên — lúc mở dialog "Xác nhận cần xử lý vụ việc"**
([IntegrityCaseDetail.tsx](../FE/src/components/admin/IntegrityCaseDetail.tsx)):

- Nếu bài nộp đang xét **còn câu tự luận chưa chấm** (`G0`, cần BE trả thêm
  field kiểu `pendingManualCount` cho case này — tương tự field đã thêm cho
  provisional score ở `sanitizeStudentSubmissionView`): hiện banner nhẹ phía
  trên checkbox "Hiệu chỉnh điểm của sinh viên", ví dụ: *"Bài này còn N câu
  tự luận chưa chấm — điểm nền dùng để tính mức trừ hiện là điểm tạm (chỉ
  tính phần đã chấm). Sau khi chấm xong, số điểm trừ sẽ tự cập nhật lại theo
  điểm cuối cùng."* Không cần chặn thao tác (giảng viên vẫn có thể cần xác
  nhận sớm vì lý do nghiệp vụ), chỉ cần họ **biết** con số họ đang thấy là
  tạm.
- Sau khi 4.3 được áp dụng, số hiển thị trong dialog (preview
  `academicScore`/`deductedScore`/`finalScore`) sẽ tự cập nhật ở lần mở dialog
  tiếp theo — nên thêm ghi chú nhỏ kiểu *"Cập nhật lần cuối: {ngày chấm xong
  gần nhất}"* nếu muốn minh bạch, nhưng không bắt buộc.

**B. Phía giảng viên — bảng danh sách kết quả** (`ExamResultsList.tsx`) và
**export CSV/PDF**:

- Áp dụng đề xuất đã nêu ở mục 3 (ưu tiên `finalScore` khi `CONFIRMED`), kèm
  điều kiện: chỉ hiển thị `finalScore` là "chính thức" khi bài đã `G1`. Khi
  còn `G0`, hiển thị điểm kèm nhãn phụ "(tạm, còn tự luận)" giống cách trang
  sinh viên đang làm, để giảng viên không nhầm điểm final khi lớp còn nhiều
  bài chưa chấm xong.
- Cột `passed` trong export (đã nêu ở mục 3) nên tính trên `finalScore`
  **chỉ khi** `status !== null && G1` — nếu `G0`, để `passed = null`/"Chưa
  xác định" thay vì suy luận từ điểm tạm.

**C. Phía sinh viên — trang chi tiết chấm điểm** (`GradingBreakdown.tsx`,
`/student/grading`):

- **Trước khi công bố (`P0`) + có phạt `CONFIRMED`:** hiện tại card "Điều
  chỉnh điểm do gian lận" đã tự ẩn vì toàn bộ `score`/`academicScore` bị
  `sanitizeStudentSubmissionView` chặn lại khi `!canShowScore`. **Điều này
  đúng và nên giữ nguyên** — sinh viên không nên thấy số điểm phạt cụ thể
  trước khi có kết quả chính thức (tránh case như đã bàn ở
  `grading-publish-flow-trace.md` — lộ thông tin trước hạn).
- **Nhưng cần khớp với tính năng "điểm tạm tính" (provisional score) mới
  thêm:** hiện tại `provisionalScore` (phần tự động chấm, hiện khi
  `showResultImmediately` bật) hoàn toàn **không kiểm tra trạng thái
  integrity** — một sinh viên đã bị `CONFIRMED` phạt vẫn thấy điểm tạm tính
  đầy đủ, chưa trừ. Đề xuất: khi `integrityReview?.status === 'CONFIRMED'`,
  **tắt hẳn hiển thị điểm tạm tính** (banner + card + đúng/sai từng câu),
  thay bằng thông điệp trung tính: *"Bài thi của bạn đang được giảng viên
  xem xét, kết quả sẽ được thông báo sau khi hoàn tất."* — không nói rõ lý
  do (tránh gợi ý sinh viên đoán được đang bị nghi ngờ gian lận nếu vụ việc
  chưa `CONFIRMED` chính thức, và với vụ việc đã `CONFIRMED` thì càng không
  nên vẫn cho xem điểm chưa trừ).
- **Sau khi công bố (`P1`) + `G1` + có phạt:** sửa điều kiện hiện card (mục
  3, bug `penaltyPercent`) để FIXED-mode cũng hiển thị, và **đồng bộ số ở
  card "Tổng quan điểm"/"Điểm cuối cùng"** với `finalScore` — không để 2 khối
  cùng trang chênh nhau như hiện tại.
- **Trường hợp hiếm `G0 + P1`** (edge case random-per-student): sinh viên
  thấy đề "đã công bố" nhưng bài họ còn tự luận chưa chấm — nên hiện banner
  tương tự banner "chấm dở" đã có (`gradingComplete === false`), **không**
  hiện điểm cuối cùng dù `resultsPublishedAt` đã có giá trị, vì với riêng bài
  này kết quả chưa thật sự đầy đủ. Tức là điều kiện hiện điểm final nên là
  `resultsPublished && gradingComplete` (2 điều kiện), không chỉ riêng
  `resultsPublished` như hiện tại.

**D. Phía sinh viên — danh sách kết quả** (`StudentResults.tsx`):

- Thêm badge nhỏ cạnh điểm khi `integrityReview?.status === 'CONFIRMED'` và
  đã `G1 + P1`, ví dụ: *"Điểm đã điều chỉnh"* (màu cam/đỏ nhạt, có tooltip
  ngắn "Điểm đã được điều chỉnh theo quyết định xử lý vi phạm toàn vẹn học
  thuật, xem chi tiết ở trang chấm điểm"), dẫn link sang `GradingBreakdown.tsx`
  để xem đầy đủ lý do/mức trừ. Tránh im lặng hiển thị 1 con số thấp hơn không
  giải thích như hiện tại.

### 4.5 Tổng hợp nguyên tắc chung rút ra

1. **Không tự refresh integrity theo grading là gốc rễ** — sửa 1 chỗ (4.3)
   để mọi hiển thị phía sau đều dựa trên số liệu đúng, thay vì cố "vá" từng
   màn hình hiển thị số liệu có thể sai.
2. Sinh viên: điểm final (có trừ phạt) **chỉ hiện khi vừa `resultsPublished`
   vừa `gradingComplete` cho đúng bài của họ** — không chỉ dựa vào cờ công
   bố của đề (đề có thể công bố sớm ở edge case random-per-student trong khi
   bài này chưa chấm xong).
3. Điểm tạm tính (provisional) **phải tắt** một khi vụ việc đã `CONFIRMED`,
   để không mâu thuẫn với quyết định xử lý gian lận sắp/đã áp dụng.
4. Giảng viên cần được **cảnh báo tại thời điểm áp dụng phạt** nếu bài chưa
   chấm xong, để hiểu con số họ đang thấy trong dialog là tạm — không cần
   chặn thao tác, chỉ cần minh bạch.
5. Mọi nơi hiển thị "đậu/rớt" cho giảng viên (bảng kết quả, export) nên dựa
   trên điểm đã trừ phạt **và** đã chấm xong — không suy luận đậu/rớt từ điểm
   tạm.

## Việc cần quyết định trước khi sửa (nếu muốn đồng bộ)

1. Có nên để `GradingBreakdown.tsx` (điểm "Tổng quan điểm" và card gian lận)
   dùng chung 1 nguồn sự thật, thay vì 2 phép tính độc lập trên cùng 1 trang?
2. `findByExam`/`getExamResultsExportData` — cột `passed`/`percentage`
   trong bảng kết quả & file xuất cho giảng viên có nên phản ánh điểm sau
   khi trừ gian lận không? (Nhiều khả năng **có** — đây trực tiếp ảnh hưởng
   quyết định đậu/rớt mà giảng viên dựa vào.)
3. Việc "bỏ tick `applyPenalty` khi CONFIRMED lại vẫn giữ nguyên penalty cũ"
   có đúng ý muốn thiết kế không, hay nên đổi thành "bỏ tick = gỡ penalty"?
   Cần làm rõ trước vì đổi ngược lại hành vi hiện tại sẽ ảnh hưởng các case
   đã xử lý trước đó.
4. Có triển khai đề xuất ở mục 4 không, và theo thứ tự nào? Đề xuất thứ tự:
   (a) 4.3 — thêm refresh integrity sau khi chấm/công bố (nền tảng, ít rủi ro
   nhất, không đổi UI); (b) sửa bug `penaltyPercent` ở `GradingBreakdown.tsx`
   (bug rõ ràng, sửa độc lập); (c) các phần còn lại của mục 4 (banner cảnh
   báo cho giảng viên, tắt điểm tạm tính khi `CONFIRMED`, badge cho sinh viên
   ở `StudentResults.tsx`) — gộp cùng đợt với việc đồng bộ `finalScore` ở
   mục 3 vì cùng đụng các file đó.
