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
