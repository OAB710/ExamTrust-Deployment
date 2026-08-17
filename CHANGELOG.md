# Changelog

Ghi lại mỗi lần cập nhật lớn: đổi gì, và **cần chạy gì trên production để dữ liệu khớp với schema mới, không bị lỗi**.

Quy ước:
- Version dạng `MAJOR.MINOR.PATCH`, tăng MINOR khi có tính năng/thay đổi schema mới, tăng PATCH khi chỉ sửa lỗi không đổi schema.
- Mục **Cập nhật dữ liệu** ghi rõ 1 trong 3 trường hợp:
  - `Không cần` — không đổi schema, không cần chạy gì.
  - `scripts/db-migrate.sh` (an toàn, giữ nguyên dữ liệu cũ) — dùng khi chỉ thêm bảng/cột mới.
  - `scripts/db-rebuild.sh` (⚠️ xóa sạch rồi seed lại) — chỉ dùng khi được ghi rõ là bắt buộc.
- Sau khi chạy xong trên EC2, đổi `BE/package.json` field `version` cho khớp version mới nhất ở đây.
- Chỉ cập nhật file này khi được yêu cầu rõ ràng (gọi skill `release-versioning`) — không tự động ghi sau mỗi lần sửa code nhỏ.

---

## [1.1.4] - 2026-08-17

### Thay đổi
- **Sửa 3 chart trống trên trang Tổng quan admin** ("Hoạt động nộp bài", "Tín hiệu toàn vẹn", "Tăng trưởng người dùng"):
  - `BE/prisma/seed-accounts-only.ts`: gán `createdAt` cho admin/lecturer01/36 sinh viên rải trong ~4 tuần gần nhất (thay vì tất cả đều nhận giá trị `now()` tại đúng lúc chạy seed) — để chart "Tăng trưởng người dùng" (bucket theo `User.createdAt`) có đường tăng trưởng thật.
  - `BE/prisma/seed-analytics-ui-demo.ts`: đổi mốc thời gian bài làm từ ngày cố định tuyệt đối `2026-08-10` sang tương đối `Date.now() - 5 ngày` — để dữ liệu luôn nằm trong khoảng 30 ngày mặc định của trang phân tích, và luôn sau ngày tạo tài khoản của sinh viên đó (không còn tình trạng sinh viên "nộp bài trước khi tài khoản tồn tại").
  - `BE/prisma/seed-monitor-ui-demo.ts`: thêm 2 bản ghi `IntegrityReview` (1 `CONFIRMED`, 1 `DISMISSED`) cho 2 trong 3 phiên `FLAGGED` — trước đó không seed nào tạo `IntegrityReview` nên "Đã review"/"Đã xác nhận" luôn bằng 0.
  - `FE/src/features/admin/AdminAnalyticsDashboard.tsx` (`ChartCard`): bug riêng biệt phát hiện trong lúc kiểm tra — `data` chỉ được dùng để quyết định hiện placeholder "chưa có dữ liệu", không được truyền xuống `<LineChart>`/`<BarChart>` bên trong nên Recharts luôn vẽ trống dù mảng data không rỗng. Sửa bằng `cloneElement(children, { data })`.

### Cập nhật dữ liệu
- **Không cần chạy thêm.** Không đổi schema. Đã chạy `seed-master.ts` (idempotent) trực tiếp trên EC2 production trong lúc chuẩn bị release này để xác nhận đúng trên MySQL 8.0 thật trước khi commit.

### Cần deploy
- **Build FE** (đẩy code `AdminAnalyticsDashboard.tsx` mới) — Cloudflare Workers Builds tự chạy khi push lên `origin/main`.
- BE trên EC2 đã có sẵn code seed mới (đã rebuild image `app` + chạy seed lúc test) — không cần "Build BE" thêm cho riêng thay đổi này trừ khi có thay đổi BE runtime khác đi kèm.

## [1.1.3] - 2026-08-16

### Thay đổi
- **Sửa lại đúng bug ở v1.1.2 (`seed-duplicate-demo.ts:93`)**: bản sửa ở v1.1.2 (`path: ['seededDuplicateKey']`, cú pháp mảng kiểu PostgreSQL) vẫn sai — chạy trên MySQL 8.0 production báo `Argument 'path': Invalid value provided. Expected String`. Cú pháp JSON path đúng cho MySQL trong Prisma là **string dạng `'$.seededDuplicateKey'`**, không phải mảng. Đã kiểm chứng trực tiếp trên production trước khi commit lần này (không lặp lại sai lầm test-only-trên-local).
- **Fix bug mới phát hiện (`seed-monitor-ui-demo.ts`, hàm `hash64`)**: nối `randomBytes(8)+randomBytes(24)+suffix` (64 hex ký tự + suffix) rồi gán vào `IntegrityLog.clientEventId` (`VarChar(80)`) và `ProctoringEvidenceCapture.captureNonceHash` (`VarChar(64)`) — luôn vượt quá giới hạn cột khi suffix đủ dài (vd `${proctoringId}-${eventType}-${index}` ~60+ ký tự). MySQL 8.0 strict mode báo lỗi rõ ràng (`P2000`); MariaDB local (dev) không strict nên trước đó không phát hiện ra (âm thầm cắt bớt dữ liệu thay vì báo lỗi). Đã đổi sang `sha256(randomBytes(16) + suffix)` — luôn ra đúng 64 ký tự hex bất kể độ dài suffix.
- **Bot Zalo**: thêm dòng `🗄️ Reset DB Status` vào lệnh `BE Info` (và `Info` cho chủ bot), dùng chung cơ chế `getLatestWorkflowRun`/`formatBuildStatus` đã có sẵn cho Build FE/BE — trước đây không có cách nào kiểm tra kết quả `Reset DB` qua Zalo, phải vào GitHub Actions xem thủ công.
- **Đã tự chạy seed tổng thành công trên production** (sau khi vá trực tiếp qua `docker cp` vào container đang chạy để xác minh trước khi commit) — xác nhận số liệu cuối: 47 users, 18 courses, 1318 questions, khớp đúng thiết kế.

### Cập nhật dữ liệu
**Không cần chạy lại `db-rebuild.sh`/seed** — đã tự chạy xong trực tiếp trên production (xem trên). Chỉ cần `Build BE` để bake 2 bản sửa vào image cho lần seed tiếp theo (nếu có) dùng đúng code đã sửa.

### Cần deploy
- `Build BE` — để image production có đúng code đã sửa (dữ liệu đã seed xong rồi, không cần chạy lại ngay).
- Cập nhật thủ công zip Lambda `zalo-webhook-lambda/index.mjs` — để lệnh `BE Info`/`Info` hiển thị `Reset DB Status`, và để version hiển thị đúng `v1.1.3` (đã bump hằng số `ZALO_APP_VERSION`).

---

## [1.1.2] - 2026-08-16

### Thay đổi
- **Fix bug seed tổng chạy trên production bị crash ở bước 6/10 (`seed-duplicate-demo.ts:93`)**: `prisma.questionVersion.findFirst({ where: { metadata: { path: 'seededDuplicateKey', ... } } })` dùng `path` dạng string — hợp lệ trên MariaDB (local dev) nhưng MySQL 8.0 thật (production) báo lỗi `1064/3143 Invalid JSON path expression`. Đã sửa thành `path: ['seededDuplicateKey']` (mảng path segment, đúng cú pháp Prisma yêu cầu cho MySQL). Phát hiện được khi chạy `Reset DB` thật trên production, không phải suy đoán — xem thêm ở `BE/docs/SEED_DATA_ANALYSIS.md`.
- Đã xác nhận: production hiện đang ở trạng thái seed dở dang (dừng ở bước 6/10 do lỗi trên) — cần chạy lại seed sau khi `Build BE` để hoàn tất các bước 6-10 còn lại (không cần `--force-reset` lại vì các bước còn lại đều idempotent).

### Cập nhật dữ liệu
**Không cần `db-rebuild.sh` (không cần force-reset lại).** Chỉ cần chạy lại `npx ts-node prisma/seed-master.ts` (không kèm `db push --force-reset`) sau khi `Build BE` để tiếp tục từ bước 6 — dữ liệu bước 1-5 đã có sẵn, các bước còn lại đều `upsert`/idempotent.

### Cần deploy
- `Build BE` — bắt buộc để bake bản sửa `seed-duplicate-demo.ts` vào image production.

---

## [1.1.1] - 2026-08-16

### Thay đổi
- **Fix bug FE build fail (`FE/src/features/lecturer/ExamAnalytics.tsx`)**: 2 dòng `console.log` debug còn sót lại tham chiếu field `questionType`/`questionMetrics` không tồn tại trên type `IntelligencePayload` (xem `exam-analytics-model.ts`), khiến `next build`/`opennextjs-cloudflare build` báo `Failed to compile` (`Type error: Property 'questionType' does not exist...`). Bug này có sẵn từ trước (không liên quan tới thay đổi ở v1.1.0), chỉ mới lộ ra khi build lại. Đã xóa 2 dòng debug.

### Cập nhật dữ liệu
**Không cần.** Chỉ sửa code FE, không đổi schema/dữ liệu.

### Cần deploy
- `Build FE` — bắt buộc để có bản build FE thành công (bản build trước đó fail do lỗi này).

---

## [1.1.0] - 2026-08-16

### Thay đổi
- **Seed tổng (`BE/prisma/seed-master.ts`, mới)**: gộp toàn bộ 10 script seed rời rạc thành 1 pipeline chạy tuần tự đúng thứ tự phụ thuộc — xem `BE/docs/SEED_DATA_ANALYSIS.md` để biết chi tiết từng bước và lý do thứ tự.
- **Khôi phục course CLS001, CLS002..CLS010, DATNUO-LECT-01/02 (`BE/prisma/seed-legacy-course-sections.ts`, mới)**: các course này từng bị gỡ khỏi `seed.ts` trước v1.0.0, khiến `seed-course-question-banks.ts` và `seed-cls001-grade1-math.ts` không thể chạy được trên DB mới. Đã phục hồi nguyên trạng từ lịch sử git.
- 8 script seed hiện có (`seed-accounts-only`, `seed-analytics-ui-demo`, `seed-monitor-ui-demo`, `seed-duplicate-demo`, `seed-topic-similarity-demo`, `seed-question-history-demo`, `seed-course-question-banks`, `seed-cls001-grade1-math`) được sửa để export `main()` thay vì tự chạy khi import, phục vụ gọi tuần tự từ `seed-master.ts`. Hành vi chạy độc lập từng file không đổi.
- Sửa bug thật `seed-cls001-grade1-math.ts`: `prisma.topic.upsert` dùng `where: { code }` không hợp lệ với schema hiện tại (chỉ có unique composite `(courseId, code)`) — gây `PrismaClientValidationError` khi chạy. Đã sửa dùng `courseId_code`.
- **Fix bug (admin + lecturer)**: biểu đồ "Phân bố kết quả" ở trang Tổng quan Admin (`BE/src/admin-dashboard/admin-dashboard.service.ts`) và ở màn "Tổng quan bài thi" của Lecturer (`BE/src/submissions/submissions.service.ts`, hàm `getExamOverview`) luôn trống — do điều kiện lọc `typeof score === 'number'` luôn `false` (Prisma trả field `score` kiểu `Decimal` về dưới dạng object `Decimal.js`, không phải `number` nguyên thủy). Đã sửa thành kiểm tra `!== null && !== undefined`.
- `BE/package.json`: `db:rebuild` đổi sang chạy `seed:all` (`seed-master.ts`) thay vì chỉ `seed.ts`; thêm alias `seed:all`, `seed:accounts`, `seed:legacy-course-sections`.
- `BE/scripts/db-rebuild.sh` (dùng bởi lệnh Zalo "Reset DB"): đổi bước seed cuối sang `prisma/seed-master.ts`.

### Cập nhật dữ liệu
**⚠️ `scripts/db-rebuild.sh`** — bắt buộc để có đủ dữ liệu baseline mới (course CLS001..010/DATNUO-LECT đã khôi phục, seed tổng 10 bước). Đã test thật bằng `npm run db:rebuild` full `--force-reset` trên DB local: 1 admin/10 lecturer/36 student, 18 course, 1318 câu hỏi — khớp đúng thiết kế từng script.

### Cần deploy
- `Build BE` — để container production có `seed-master.ts`/`seed-legacy-course-sections.ts` mới và 2 chỗ fix bug biểu đồ.
- `Build FE` — không có thay đổi FE trong bản này, không bắt buộc nhưng vô hại nếu build lại.
- Sau khi `Build BE` xong, chạy lệnh Zalo **"Reset DB"** để áp dụng seed tổng mới lên production (thao tác xóa sạch dữ liệu hiện có).

---

## [1.0.0] - 2026-08-16

Bản phát hành chính thức đầu tiên có ghi version.

### Thay đổi
- Lệnh bot Zalo **"System Overview"**: tổng quan số liệu hệ thống (người dùng, khóa học, bài thi, câu hỏi, tín hiệu giám sát rủi ro) kèm nhận xét tự động theo ngưỡng.
- Endpoint `GET /system-overview` (`BE/src/admin-dashboard/system-overview.controller.ts`) — không xác thực, chỉ trả số liệu tổng hợp đã hiển thị sẵn trên các màn admin.
- Trang admin "DevOps & Bot": danh sách lệnh bot phân nhóm "Hệ Thống" / "DevOps", đánh dấu badge "Công khai" cho lệnh ai cũng xem được.
- Bot Zalo: lệnh **Info** và **System Overview** hiển thị dòng `🏷️ Version: vX.Y.Z` cho mọi user, lấy từ hằng số `ZALO_APP_VERSION` trong `zalo-webhook-lambda/index.mjs`.
- Sửa lỗi format tin nhắn bot khi người ngoài chủ bot nhắn Info (dòng `--------------------` dính vào dòng trước, Build Status thiếu dòng trống ngăn cách).
- Thêm `BE/scripts/db-migrate.sh` — sync schema an toàn (`prisma db push` không `--force-reset`), giữ nguyên dữ liệu cũ, khác với `db-rebuild.sh` (xóa sạch).
- Thêm skill dự án `.claude/skills/release-versioning/SKILL.md` — quy trình đặt tên commit, ghi CHANGELOG, gắn tag cho mỗi lần release, chỉ chạy khi được yêu cầu rõ ràng.

### Cập nhật dữ liệu
**Không cần.** `systemOverview()` chỉ đọc (count/aggregate) từ các bảng đã tồn tại, không thêm bảng/cột mới.

### Cần deploy
- `Build BE` — để endpoint `/system-overview` và field `category`/`public` trong `devops-status` có hiệu lực trên production.
- `Build FE` — để trang admin "DevOps & Bot" nhận UI mới.
- Cập nhật thủ công zip Lambda `zalo-webhook-lambda/index.mjs` (không qua GitHub Actions) — để bot có lệnh System Overview, format tin nhắn mới, và hiển thị version.
