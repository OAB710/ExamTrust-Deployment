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
