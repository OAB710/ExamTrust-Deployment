# Cài đặt Database từ đầu cho ExamTrust (XAMPP + Prisma)

Tài liệu này dành cho trường hợp XAMPP/MySQL local bị lỗi và bạn muốn **xóa sạch, cài lại từ đầu**,
sau đó chỉ cần **1 lệnh** để dựng lại toàn bộ bảng (không cần đụng tay vào file `.sql` nữa).

Điểm mấu chốt: **không dùng `prisma migrate deploy` để dựng DB local**. Thư mục
[prisma/migrations](../prisma/migrations) hiện có 39+ migration được chỉnh tay qua nhiều tháng,
rất dễ lệch thứ tự / lỗi khi chạy lại từ đầu trên DB rỗng — đây chính là lý do mỗi lần bạn cần tôi sửa
file SQL. Thay vào đó, dùng `prisma db push`: lệnh này đọc thẳng [schema.prisma](../prisma/schema.prisma)
(nguồn sự thật duy nhất) và tạo ra toàn bộ bảng tương ứng, bỏ qua lịch sử migration hoàn toàn.

---

## 1. Gỡ sạch XAMPP/MySQL khi bị lỗi

1. Mở XAMPP Control Panel → **Stop** MySQL (và Apache nếu đang chạy).
2. Nếu MySQL không stop được, mở Task Manager, kill toàn bộ tiến trình `mysqld.exe`.
3. Gỡ cài đặt XAMPP qua **Settings → Apps** (Windows), hoặc chạy `uninstall.exe` trong thư mục cài XAMPP.
4. Xóa hẳn thư mục cài đặt còn sót lại, ví dụ `d:\application\xampp` (đổi theo đường dẫn thật của bạn).
   Đây là bước quan trọng nhất — data MySQL cũ (`xampp/mysql/data`) thường là nguồn gây lỗi (file
   `ibdata1`, `ib_logfile*` hỏng), xóa hết thì cài lại mới sạch được.

## 2. Cài lại XAMPP

1. Tải bản XAMPP mới nhất tại trang chủ Apache Friends, cài vào một thư mục sạch (ví dụ lại
   `d:\application\xampp`).
2. Mở XAMPP Control Panel → **Start** MySQL.
3. Kiểm tra kết nối được bằng client `mysql` đi kèm XAMPP:

   ```powershell
   & "d:\application\xampp\mysql\bin\mysql.exe" -u root -e "SELECT VERSION();"
   ```

   Mặc định XAMPP tạo user `root` không mật khẩu — khớp với `DATABASE_URL` project đang dùng.

## 3. Cài project

```powershell
cd d:\KLTN\ExamTrust\BE
npm install
```

`postinstall` sẽ tự chạy `prisma generate`, không cần chạy tay.

Kiểm tra file `.env` (copy từ `.env.example` nếu chưa có) có dòng:

```
DATABASE_URL="mysql://root@127.0.0.1:3306/examtrust"
```

Đổi user/password/port nếu cấu hình MySQL của bạn khác mặc định.

## 4. Tạo database rỗng

Mỗi lần muốn làm lại từ đầu, chỉ cần một database **rỗng** (không cần tạo bảng tay):

```powershell
& "d:\application\xampp\mysql\bin\mysql.exe" -u root -e "DROP DATABASE IF EXISTS examtrust; CREATE DATABASE examtrust CHARACTER SET utf8mb4;"
```

Hoặc làm bằng phpMyAdmin (`http://localhost/phpmyadmin`): xóa database `examtrust` nếu tồn tại, tạo mới
với collation `utf8mb4_general_ci` (hoặc để mặc định).

## 5. Một lệnh duy nhất để dựng toàn bộ bảng + dữ liệu mẫu

```powershell
npm run db:rebuild
```

Lệnh này (đã thêm vào `package.json`) làm 2 việc:

1. `prisma db push --force-reset` — đọc `schema.prisma`, xóa sạch bảng hiện có trong DB `examtrust` và
   tạo lại **toàn bộ bảng, enum, index, foreign key** đúng như schema hiện tại. Không phụ thuộc migration
   history, nên schema có sửa/thêm bảng thế nào cũng luôn ra kết quả đúng.
2. `npm run seed` (`prisma/seed.ts`) — chèn dữ liệu mẫu: tài khoản, khóa học, câu hỏi, v.v.

Sau khi chạy xong, database có đầy đủ bảng và dữ liệu demo, sẵn sàng chạy `npm run start:dev`.

### Chỉ dựng bảng, không seed dữ liệu

```powershell
npx prisma db push --force-reset --accept-data-loss --schema prisma/schema.prisma
```

### Seed thêm dữ liệu tùy biến (tùy chọn)

Các script seed bổ sung trong `prisma/`, chạy sau khi đã có bảng:

```powershell
npm run seed:question-banks
npm run seed:question-history-demo
```

---

## 6. Các lệnh Prisma khác hay dùng

| Lệnh | Khi nào dùng |
|---|---|
| `npm run prisma:generate` | Sau khi sửa `schema.prisma`, cập nhật lại Prisma Client (TypeScript types). |
| `npm run prisma:studio` | Mở giao diện xem/sửa dữ liệu trong trình duyệt. |
| `npm run db:rebuild` | Làm lại DB local từ đầu (xóa sạch bảng + seed lại), dùng khi schema đổi nhiều hoặc DB bị bẩn. |

**Lưu ý:** `prisma migrate dev` / `prisma migrate deploy` vẫn tồn tại trong `package.json` cho môi trường
đã có migration history ổn định (ví dụ production). Với máy local đang phải cài lại liên tục, **luôn ưu
tiên `db:rebuild`** — không cần quan tâm đến thư mục `prisma/migrations` nữa.

---

## 7. Khi schema thay đổi (thêm bảng/cột mới)

`db:rebuild` (Bước 5) chỉ dành cho máy **local**, không đụng đến migration history. Khi bạn sửa
`schema.prisma` (thêm bảng, thêm cột, đổi kiểu dữ liệu...), có 2 tình huống:

### A. Đang code/thử nghiệm trên local, chưa cần deploy

Cứ sửa `schema.prisma` rồi chạy lại:

```powershell
npm run db:rebuild
```

`db push` tự so sánh schema mới với DB, tạo/sửa bảng cho khớp, không cần viết file migration nào cả.
Lặp lại bước này bao nhiêu lần tùy ý trong lúc đang thiết kế schema.

### B. Đã chốt thay đổi, cần đưa lên production

Production dùng `npm run prisma:migrate` (`prisma migrate deploy`) — lệnh này **chỉ** áp dụng các file
migration đã có trong `prisma/migrations`, nó không tự tạo migration mới và không biết gì về những gì
`db push` đã làm ở local. Vì vậy trước khi deploy, phải tạo migration chính thức:

```powershell
npx prisma migrate dev --schema prisma/schema.prisma --name mo-ta-ngan-thay-doi
```

Lệnh này sẽ:

1. Phát hiện DB local đang "lệch" so với migration history (vì trước đó bạn dùng `db push`) và hỏi có
   muốn **reset lại DB local** không — cứ đồng ý (`y`), vì local vốn đã coi là có thể dựng lại bất cứ lúc
   nào bằng `db:rebuild`, không mất gì quan trọng.
2. Tự sinh ra file `migration.sql` mới trong `prisma/migrations/<timestamp>_mo-ta-ngan-thay-doi/`, áp
   dụng nó vào DB local, và tự chạy `prisma generate`.
3. Commit thư mục migration mới đó vào git.

Trên server production, chỉ cần:

```powershell
npm run prisma:migrate
```

để áp dụng đúng migration mới, giữ nguyên toàn bộ dữ liệu thật đang có (không `--force-reset` như local).

**Không tự sửa tay file `migration.sql` do Prisma sinh ra**, trừ trường hợp Prisma hiểu sai ý định (ví
dụ đổi tên cột nhưng Prisma sinh ra DROP COLUMN + ADD COLUMN mới, làm mất dữ liệu) — lúc đó mới cần chỉnh
lại SQL trước khi chạy `migrate dev`/`migrate deploy`. Đây chính là nguồn gốc của việc phải sửa SQL tay
liên tục trước kia; giờ để Prisma tự sinh file, chỉ can thiệp khi thật sự cần.

## 8. Xử lý lỗi thường gặp

- **`Can't connect to MySQL server on '127.0.0.1'`**: MySQL trong XAMPP chưa Start, hoặc port 3306 bị
  chiếm bởi service MySQL khác đang cài song song trên máy — kiểm tra Task Manager / Services.
- **`Access denied for user 'root'`**: `.env` đang có password nhưng MySQL XAMPP không set password
  (hoặc ngược lại). Sửa `DATABASE_URL` cho khớp, hoặc set lại password root bằng phpMyAdmin.
- **`Unknown database 'examtrust'`**: chưa tạo database rỗng ở Bước 4 — `db push` không tự tạo database,
  chỉ tạo bảng bên trong database đã tồn tại.
- **File data MySQL bị lỗi lặp lại nhiều lần**: nên chuyển sang cài MySQL độc lập (MySQL Installer chính
  thức) hoặc dùng Docker (`mysql:8`) thay vì XAMPP, để tránh xung đột với Apache/PHP không liên quan đến
  project Node.js/NestJS này.
