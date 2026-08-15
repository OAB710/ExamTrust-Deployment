---
name: release-versioning
description: Quy trình đặt tên commit, ghi CHANGELOG.md, và gắn git tag cho mỗi lần bump version trong ExamTrust. PHẢI dùng khi user yêu cầu "tạo version mới", "bump version", "release", "gắn tag version", hoặc bất kỳ lúc nào chuẩn bị đóng gói một đợt thay đổi (feature/fix) thành 1 version chính thức. Không dùng cho commit thường ngày không liên quan tới version.
---

# Release & Versioning (đặt tên commit + CHANGELOG + tag)

Repo dùng versioning kiểu `MAJOR.MINOR.PATCH`, không dùng `prisma migrate deploy` (lịch sử migration thiếu baseline — xem `EC2_DB_DEPLOY_NOTES.md`) nên schema production được đồng bộ thủ công qua `prisma db push`. Vì vậy version + CHANGELOG.md đóng vai trò thay thế cho "lịch sử migration" để biết mỗi bản build cần chạy gì.

> **Quan trọng:** KHÔNG tự động chạy quy trình này (ghi CHANGELOG.md, đổi `ZALO_APP_VERSION`, commit `Release vX.Y.Z`, tạo tag) sau mỗi lần sửa code nhỏ. Chỉ thực hiện khi user CHỦ ĐỘNG yêu cầu — gọi skill này rõ ràng, hoặc nói thẳng "bump version"/"release"/"tạo version mới". Sửa code/tính năng bình thường thì commit như thường lệ, không kèm bump version.

## 1. Tăng version thế nào

- Tăng **MINOR** (`1.2.0` → `1.3.0`): có tính năng mới, hoặc đổi schema (thêm/sửa/xóa bảng-cột).
- Tăng **PATCH** (`1.2.0` → `1.2.1`): chỉ sửa lỗi/UI, không đổi schema.
- Không tự ý tăng MAJOR — hỏi user nếu nghi ngờ đây là breaking change lớn.

## 2. Luôn ghi vào `CHANGELOG.md` (ở gốc repo) trước

Thêm 1 entry mới lên đầu (ngay dưới phần "Quy ước"), theo đúng khuôn:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Thay đổi
- Mô tả ngắn gọn từng thay đổi, kèm tên file chính đã sửa.

### Cập nhật dữ liệu
Một trong 3:
- **Không cần.** — không đổi schema.
- **`scripts/db-migrate.sh`** (an toàn, giữ nguyên dữ liệu cũ) — chỉ thêm bảng/cột mới.
- **⚠️ `scripts/db-rebuild.sh`** (xóa sạch rồi seed lại) — chỉ khi bắt buộc, nêu rõ lý do.

### Cần deploy
- Liệt kê đúng bước cần chạy (Build FE / Build BE / cập nhật zip Lambda thủ công / v.v.)
```

## 3. Commit — bắt buộc theo mẫu tên sau

```
Release vX.Y.Z: <mô tả ngắn>

<mô tả dài hơn nếu cần, giải thích lý do>
```

Ví dụ thật đã dùng: `Release v1.2.1: CHANGELOG.md + quy trinh versioning`.

**Quy tắc quan trọng nhất: commit này PHẢI chứa bản cập nhật `CHANGELOG.md` cho version đó.** Có thể gộp thêm các file liên quan khác (script, config...) vào cùng commit — không bắt buộc tách riêng chỉ 1 file `.md` — nhưng CHANGELOG.md luôn phải có mặt trong đúng commit sẽ được tag.

Nếu code thay đổi (feature/fix) đã được commit ở 1 commit khác trước đó rồi mới nhớ ra cần bump version, tạo thêm 1 commit riêng chỉ chứa update CHANGELOG.md (+ file liên quan nếu có) theo mẫu tên trên, và tag vào chính commit đó — KHÔNG tag vào commit code cũ không có CHANGELOG.md.

## 4. Gắn tag — làm ngay sau khi commit, cùng một lượt

```bash
git tag -a vX.Y.Z <commit-hash-vừa-tạo> -m "<mô tả ngắn, không dấu>"
```

- Tag annotated (`-a`), không dùng lightweight tag.
- **Chỉ tag vào commit có chứa CHANGELOG.md của đúng version đó** — không tag vào commit code thường không có file version.
- Nếu lỡ tag sai chỗ và commit đó CHƯA push (`git log origin/main..HEAD` phải thấy commit này): `git tag -d vX.Y.Z` rồi tag lại đúng chỗ. Nếu tag ĐÃ push lên remote, phải hỏi user trước khi xóa/di chuyển tag (thao tác ảnh hưởng shared state).
- Nếu commit message cần sửa lại (amend) sau khi đã tag: amend trước, xóa tag cũ, tạo lại tag trỏ vào hash mới (amend đổi hash).
- Tag mặc định chỉ tạo local — không tự `git push --tags`, phải hỏi user trước khi push tag lên remote.

## 5. Sau khi tag xong

Nhắc user (không tự làm nếu không được yêu cầu):
- Có cần chạy `scripts/db-migrate.sh` hoặc `scripts/db-rebuild.sh` trên EC2 theo đúng mục "Cập nhật dữ liệu" đã ghi không.
- Có cần "Build FE"/"Build BE" hoặc build lại Lambda `zalo-webhook-lambda/index.mjs` không.
- Nếu Lambda có in version ra bot (`ZALO_APP_VERSION` trong `zalo-webhook-lambda/index.mjs`), nhắc cập nhật hằng số này khớp version mới rồi mới build lại zip.

## 6. Giới hạn hiện tại (chưa làm)

**Chức năng rollback (quay code + DB về đúng version cũ) CHƯA được xây dựng** — hiện chỉ có tag để xác định đúng commit của từng version. Việc quay DB về đúng schema/dữ liệu tại thời điểm đó (backup/restore, hay script rollback tự động) để làm sau, không tự ý implement khi chưa được yêu cầu rõ.
