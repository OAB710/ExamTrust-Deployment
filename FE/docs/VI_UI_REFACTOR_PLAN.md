# Kế hoạch chuẩn hóa tiếng Việt cho UI (Frontend)

> Phạm vi: chỉ UI text hiển thị cho người dùng (label, button, title, placeholder, toast, validation message, table header, tooltip, dialog...). Code/biến/hàm giữ nguyên tiếng Anh — không cần dịch.
> Không có hệ thống i18n trong dự án — toàn bộ text là chuỗi cứng trong JSX. Sửa trực tiếp tại chỗ.
> Nguồn khảo sát: xem báo cáo khảo sát FE ngày 2026-08-06 (đã liệt kê đầy đủ file:line ở dưới mỗi Part).

## Quy tắc chung đã chốt (Glossary)

| Khái niệm | Chuẩn dùng | Lý do / Ghi chú |
|---|---|---|
| Edit (sửa 1 bản ghi) | **Sửa** | Không dùng "Chỉnh sửa" hay "Edit" |
| Authenticate (đăng nhập) | **Đăng nhập** / "Đang đăng nhập..." | Không dùng "xác thực" cho nghĩa này |
| Validate (kiểm tra dữ liệu nhập) | **Kiểm tra hợp lệ** / "Vui lòng kiểm tra lại các trường bị lỗi" | Không dùng "xác thực" cho nghĩa này |
| Confirm (duyệt/đồng ý hành động) | **Xác nhận** | Giữ nguyên như đang dùng ở IntegrityCaseDetail, Profile |
| Difficulty: Easy/Medium/Hard | **Dễ / Trung bình / Khó** | Việt hóa toàn bộ, không giữ "Medium" |
| AI Assistant | **Trợ lý AI** | Việt hóa toàn bộ 3 vị trí đang dùng |
| Delete/Cancel | Xóa / Hủy | Đã nhất quán sẵn — chỉ áp dụng khi thấy sai lệch |
| Đăng Nhập (Title Case) | **Đăng nhập** (viết thường, đúng chính tả VN) | Tiếng Việt không viết hoa từng chữ như tiếng Anh |

Quy tắc bổ sung khi refactor từng file:
- Sửa cả các message bị lỗi encode (HTML numeric entity như `&#243;` ) và tiếng Việt bị mất dấu (ví dụ ExamReadyCheck.tsx phần webcam, ExamAnalytics.tsx phần bộ lọc) — coi là lỗi kỹ thuật cần sửa kèm theo, không phải phần riêng.
- `components/ui/*` (bản gốc shadcn, ví dụ carousel "Previous slide", dialog "Close") — **Việt hóa cả sr-only label** vì vẫn là text hiển thị cho người dùng (screen reader).
- Sau khi sửa xong 1 Part, chạy `npm run build` hoặc `tsc --noEmit` trong `FE/` để đảm bảo không lỗi TypeScript/JSX do sửa text.

## Quy trình làm việc

1. Chỉ chạy 1 Part khi được yêu cầu rõ ràng ("Chạy Part X").
2. Sau khi sửa xong Part, thực hiện **kiểm duyệt có bằng chứng**: liệt kê từng file đã sửa, số dòng, nội dung trước/sau, và xác nhận không còn sót chuỗi Anh/thuật ngữ lệch (bằng grep cụ thể, không kết luận mơ hồ).
3. Đánh dấu `[x]` cho Part trong file này kèm ngày hoàn thành.
4. Chuyển sang Part tiếp theo khi được yêu cầu.
5. Part cuối là rà soát toàn bộ lại từ đầu đến cuối trước khi kết thúc.

---

## Part 0 — Glossary & rà soát nền (không sửa code, chỉ chốt chuẩn) — [x] Hoàn thành 2026-08-06

Đã chốt bảng thuật ngữ ở trên với người dùng qua hỏi đáp trực tiếp.

---

## Part 1 — Auth & Layout dùng chung (Login, Header, DashboardLayout, Landing, Profile, ResetPassword)

Trạng thái: [x] Hoàn thành 2026-08-06 — xem kiểm duyệt bên dưới

File liên quan:
- `FE/src/features/Login.tsx` — sửa heading dòng 104 "Đăng Nhập ExamTrust" → "Đăng nhập ExamTrust"; kiểm tra dòng 167 "Đang xác thực" → "Đang đăng nhập"
- `FE/src/components/layout/Header.tsx`
- `FE/src/components/layout/DashboardLayout.tsx`
- `FE/src/features/Landing.tsx`
- `FE/src/features/Profile.tsx` (đã tốt — chỉ kiểm tra lại theo glossary "Xác nhận" cho confirm password)
- `FE/src/features/ResetPassword.tsx`

Mục tiêu: đồng nhất "Đăng nhập/Đăng xuất", tách nghĩa "xác thực" theo glossary.

### Kiểm duyệt Part 1 (2026-08-06)

Đã sửa:
- `FE/src/features/Login.tsx:104` — `"Đăng Nhập ExamTrust"` → `"Đăng nhập ExamTrust"` (đúng chính tả, đồng nhất với nút submit dòng 171).
- `FE/src/features/Login.tsx:167` — `"Đang xác thực"` → `"Đang đăng nhập"` (theo glossary: authenticate = "Đăng nhập", không dùng "xác thực").

Đã kiểm tra, không cần sửa (bằng chứng cụ thể):
- `FE/src/components/layout/Header.tsx` — dòng 61/67: "Đăng xuất"/"Đăng nhập" đã đúng, không có chuỗi Anh.
- `FE/src/components/layout/DashboardLayout.tsx` — dòng 328/337/344/447: "Đăng xuất" nhất quán; toàn bộ nav item (114-147) đã tiếng Việt.
- `FE/src/features/Landing.tsx` — dòng 93/211/229: "Đăng nhập" nhất quán, không có chuỗi Anh trong text hiển thị.
- `FE/src/features/ResetPassword.tsx` — toàn file tiếng Việt, không có chuỗi Anh.
- `FE/src/features/Profile.tsx:226,433` — "Xác nhận mật khẩu mới" đúng theo glossary (confirm = "Xác nhận"), không đổi.

Grep xác nhận không còn sót:
- `grep -rn "Đăng Nhập\|Đang xác thực" FE/src/features/Login.tsx FE/src/components/layout/Header.tsx FE/src/components/layout/DashboardLayout.tsx FE/src/features/Landing.tsx` → không có kết quả.

Kiểm tra biên dịch: `npx tsc --noEmit -p FE/tsconfig.app.json` → chạy sạch, không lỗi (không phá vỡ JSX/TS do sửa text).

---

## Part 2 — Admin: Người dùng & Thiết lập hệ thống (100% tiếng Anh hiện tại)

Trạng thái: [x] Hoàn thành 2026-08-06 — xem kiểm duyệt bên dưới

File liên quan:
- `FE/src/features/admin/UserRoleManagement.tsx` — toàn bộ label, dialog, table header, toast (dòng 355-848 theo báo cáo)
- `FE/src/features/admin/SystemPolicyConfig.tsx` — toàn bộ label cấu hình (dòng 174-551)
- `FE/src/features/admin/AuditLogViewer.tsx` — toàn bộ (dòng 74-184)
- `FE/src/features/admin/TransparencyDashboard.tsx` — dòng 16

Mục tiêu: Việt hóa toàn bộ, dùng "Sửa" thay "Edit".

### Kiểm duyệt Part 2 (2026-08-06)

**Sự cố kỹ thuật gặp phải:** trong lúc sửa `UserRoleManagement.tsx`, các chỉnh sửa từng đợt (Edit tool) bị ghi đè trở lại nội dung cũ trên đĩa — xác nhận bằng `git diff` cho thấy chỉ 1/6 lần sửa còn tồn tại. Nguyên nhân nghi do có agent khác chạy song song đụng file. Đã xử lý bằng cách ghi lại toàn bộ file trong 1 lần (Write) rồi `git diff --stat` xác nhận ngay để chắc chắn không bị mất.

**Đã sửa — `FE/src/features/admin/UserRoleManagement.tsx`** (205 dòng thay đổi, xác nhận qua `git diff --stat`):
- `USER_FILTERS`: Role→Vai trò, All Roles→Tất cả vai trò, Student/Lecturer/Admin→Sinh viên/Giảng viên/Quản trị viên; Status→Trạng thái, Active/Pending/Suspended→Đang hoạt động/Chờ xử lý/Đã tạm khóa; Department→Khoa; Student ID→Mã sinh viên; Created At→Ngày tạo.
- `userSortOptions`: Name/Role/Status/Date Created → Họ và tên/Vai trò/Trạng thái/Ngày tạo.
- 11 toast message (create/update/role/status/delete) dịch sang tiếng Việt, ví dụ dòng 355 "Please fill full name, email, and password" → "Vui lòng nhập họ tên, email và mật khẩu"; dòng 373 "User created successfully" → "Đã tạo người dùng thành công".
- Toàn bộ UI: `title="All Users"`→"Tất cả người dùng", "Add User"→"Thêm người dùng", "Create User"→"Tạo người dùng", label Full Name/Initial Password/Role/Status/Department/Student ID → Họ và tên/Mật khẩu ban đầu/Vai trò/Trạng thái/Khoa/Mã sinh viên; AdminStatCard "Total Users"/"Students (current page)"/... → Tổng số người dùng/Sinh viên (trang hiện tại)/...; SearchBar placeholder, FilterPanel title/description, CardTitle "Results"→"Kết quả", table header Name/Role/Department/Status/Created/Actions → Họ và tên/Vai trò/Khoa/Trạng thái/Ngày tạo/Thao tác; "No users found"→"Không tìm thấy người dùng"; `title="Edit user"` → "Sửa người dùng" (theo glossary Edit=Sửa); "Suspend/Activate account"→"Tạm khóa/Kích hoạt tài khoản"; ConfirmActionDialog "Archive user"→"Lưu trữ người dùng"; Edit dialog title/description/label/placeholder/"Save Changes"→"Lưu thay đổi"; `itemLabel="users"`→"người dùng".
- **Phát hiện thêm ngoài báo cáo khảo sát:** dòng bảng đang truyền `children={item.status || "active"}` trực tiếp vào `StatusBadge`, việc này ghi đè cơ chế dịch nhãn tự động theo `domain="user"` khiến cột Trạng thái luôn hiển thị tiếng Anh thô ("active"/"suspended") dù component đã có bản dịch. Đã bỏ `children` để dùng nhãn tự động.

**Đã sửa — `FE/src/components/ui/status-badge.tsx`:**
- Domain `user` thiếu key `pending` (chỉ có active/suspended/inactive) nên trạng thái "Chờ xử lý" của user không có nhãn Việt. Đã thêm `pending: { tone: "warning", label: "Chờ xử lý" }` — dùng đúng nhãn đã có ở domain `submission` để nhất quán thuật ngữ toàn app.

**Đã sửa — `FE/src/features/admin/SystemPolicyConfig.tsx`** (119 dòng, toàn bộ label/placeholder/select item được Việt hóa): tiêu đề trang, 5 card (Ngưỡng toàn vẹn học thuật, Chính sách tính điểm, Truy cập & Bảo mật, Lưu trữ dữ liệu, Bảo trì hệ thống) và toàn bộ control con — chi tiết xem nội dung file, không còn nhãn tiếng Anh nào.

**Đã sửa — `FE/src/features/admin/AuditLogViewer.tsx`** (58 dòng): tiêu đề, mô tả, 4 thẻ thống kê, ô tìm kiếm, bộ lọc mức độ, bảng log, phân trang. Phát hiện thêm: dòng `<StatusBadge>{log.severity}</StatusBadge>` cũng bị lỗi tương tự UserRoleManagement (children override domain label) — đã bỏ children, dùng nhãn có sẵn ở domain `severity` (đã là tiếng Việt từ trước).

**Đã sửa — `FE/src/features/admin/TransparencyDashboard.tsx`** (43 dòng): không chỉ dòng 16 như báo cáo ban đầu ghi nhận — toàn bộ nội dung 4 mục (thống kê, cảnh báo toàn vẹn, quyết định học thuật, nhật ký kiểm toán) đều là tiếng Anh, đã dịch hết.

**Kiểm tra grep còn sót (sau khi sửa, trên cả 4 file):**
```
grep -nE '>[A-Za-z][A-Za-z0-9 ,().%/+-]*[A-Za-z]<|placeholder="[A-Za-z]|label="[A-Za-z]|title="[A-Za-z]' UserRoleManagement.tsx SystemPolicyConfig.tsx AuditLogViewer.tsx TransparencyDashboard.tsx
```
→ chỉ còn "Email" và "ID" (giữ nguyên theo chuẩn quốc tế, không phải sót dịch).

**Kiểm tra biên dịch:** `npx tsc --noEmit -p FE/tsconfig.app.json` → sạch, không lỗi sau tất cả các sửa của Part 2 (bao gồm cả status-badge.tsx dùng chung).

---

## Part 3 — Admin: Khóa học & Bài thi

Trạng thái: [x] Hoàn thành 2026-08-06 — xem kiểm duyệt bên dưới

File liên quan:
- `FE/src/features/admin/CourseManagement.tsx` — các placeholder/dialog tiếng Anh (835-1814), đồng bộ với dialog lưu trữ đã Việt
- `FE/src/features/admin/ExamManagement.tsx` — toast tiếng Anh (399-491) đồng bộ với phần đã Việt
- `FE/src/features/admin/IntegrityOverview.tsx` — rà soát theo glossary (đã tốt, chỉ kiểm tra "Xác nhận")
- `FE/src/components/admin/IntegrityCaseDetail.tsx` — rà soát theo glossary
- `FE/src/features/admin/AnalyticsReport.tsx` — rà soát nhanh (đã tốt)

### Kiểm duyệt Part 3 (2026-08-06)

**Đã sửa — `FE/src/features/admin/CourseManagement.tsx`** (242 dòng thay đổi, xác nhận qua `git diff --stat`, ghi 1 lần qua Write để tránh sự cố bị đè như Part 2): dịch toàn bộ — filter definitions (Status/Lecturer/Academic year/Term/Credits → Trạng thái/Giảng viên/Năm học/Học kỳ/Tín chỉ, dùng đúng nhãn có sẵn ở `status-badge.tsx` domain `course` và ở `lecturer/CourseManagement.tsx` để nhất quán thuật ngữ xuyên 2 file), sort options, toàn bộ wizard tạo khóa học 3 bước (Course Info/Add Lecturer/Add Students → Thông tin khóa học/Thêm giảng viên/Thêm sinh viên), form tạo/sửa khóa học, khối nhập CSV/Excel, kết quả ghi danh, 4 thẻ thống kê, thanh tìm kiếm, bảng danh sách (Code/Course Name/.../Actions → Mã khóa học/Tên khóa học/.../Thao tác), dialog Sửa khóa học, và 5 toast (create/update/delete/assign lecturer/load) — ví dụ dòng 688 "Course created successfully" → "Đã tạo khóa học thành công". Dialog lưu trữ/khôi phục (dòng 1814+) đã sẵn tiếng Việt từ trước, giữ nguyên — không còn lệch ngôn ngữ giữa 2 nhóm dialog trong cùng file như báo cáo khảo sát ghi nhận.
- **Sự cố trong lúc sửa:** khi viết lại toàn bộ file bằng Write, quá trình dán nội dung vô tình làm hỏng escape sequence `̀-ͯ` trong hàm `toAsciiUpper` (dùng để bỏ dấu tiếng Việt khi tạo mã khóa học tự động) thành ký tự Unicode literal. Đã kiểm tra bằng `node -e` in ra codepoint từng ký tự — xác nhận codepoint vẫn đúng U+0300–U+036F, và test trực tiếp hàm với chuỗi "Thuật toán nâng cao" cho ra "THUAT TOAN NANG CAO" đúng như kỳ vọng → không phải lỗi, chỉ là cách hiển thị khác, hành vi không đổi.

**Đã sửa — `FE/src/features/admin/ExamManagement.tsx`** (28 dòng): 6 toast message (xóa/đổi lịch bài thi), "Loading exams..." → "Đang tải danh sách bài thi...", `title="All Exams"` → "Tất cả bài thi", 4 label thẻ thống kê (Total Exams/Published/Ongoing/Total Submissions → Tổng số bài thi/Đã công bố/Đang diễn ra/Tổng số lượt nộp, dùng đúng nhãn có sẵn ở `status-badge.tsx` domain `exam`), `itemLabel="exams"` → "bài thi". Phần còn lại của file (dialog đổi lịch, dialog xóa, table, dropdown thao tác) đã sẵn tiếng Việt từ trước.

**Đã sửa — `FE/src/features/admin/AnalyticsReport.tsx`** (2 dòng): phát hiện thêm ngoài báo cáo khảo sát — dòng 16 (trước đây được đánh giá "đã tốt") còn lẫn 3 thuật ngữ tiếng Anh trong câu văn: "pagination/filter server-side" và "dashboard" → dịch thành "phân trang/lọc phía máy chủ" và "trang tổng quan".

**Đã kiểm tra, không cần sửa:**
- `FE/src/features/admin/IntegrityOverview.tsx` — rà soát toàn file, xác nhận 100% tiếng Việt, "Xác nhận" dùng đúng nghĩa confirm theo glossary (dòng 438, 486, 575).
- `FE/src/components/admin/IntegrityCaseDetail.tsx` — rà soát toàn file, xác nhận 100% tiếng Việt, không có chuỗi Anh nào sót.

**Kiểm tra grep còn sót** trên cả 5 file Part 3 → chỉ khớp các chuỗi đã là tiếng Việt (grep bắt vì ký tự đầu là chữ Latin hoa), không còn tiếng Anh thực sự nào.

**Kiểm tra biên dịch:** `npx tsc --noEmit -p FE/tsconfig.app.json` → sạch, không lỗi.

---

## Part 4 — Lecturer: Tạo/Quản lý bài thi (CreateExam, cấu hình, chia sẻ link)

Trạng thái: [x] Hoàn thành 2026-08-06 — xem kiểm duyệt bên dưới

File liên quan:
- `FE/src/features/lecturer/CreateExam.tsx` — heading "Exam Created!" (1010), "AI Assistant" (1710)→"Trợ lý AI", "Number of Questions"/"Question Type Mix" (2079,2110,2447,2477), "Medium" (2146,2509)→"Trung bình", toast Anh (493-989)
- `FE/src/features/lecturer/AdvancedExamRuleConfig.tsx` — toàn bộ (275-629)
- `FE/src/features/lecturer/GenerateExamLink.tsx` — toàn bộ (213-562)
- `FE/src/features/lecturer/ExamPreview.tsx` — toast + dialog (209-370), giữ "Sửa câu hỏi" (550) đã đúng
- `FE/src/features/lecturer/ExamManagement.tsx` (nếu khác file admin, kiểm tra riêng)

### Kiểm duyệt Part 4 (2026-08-06)

**Đã sửa — `FE/src/features/lecturer/CreateExam.tsx`** (93 dòng thay đổi, xác nhận qua `git diff --stat`, sửa bằng Edit theo từng đoạn để giảm rủi ro bị đè trên file 2735 dòng): 7 toast message validate/AI (dòng 495-1009, ví dụ "Question text is required." → "Vui lòng nhập nội dung câu hỏi."); heading "Exam Created!" → "Đã tạo bài thi!"; "Add question source" → "Thêm nguồn câu hỏi"; "AI Assistant" → "Trợ lý AI" (theo glossary); "Number of Questions"/"Question Count" → "Số lượng câu hỏi" (2 vị trí khác nhau trong wizard, cùng 1 khái niệm nên dùng chung 1 nhãn); "Question Type Mix" → "Phân bổ dạng câu hỏi" (tái dùng đúng nội dung tooltip `ContextHelp` đã có sẵn cạnh nhãn này); "Processing" → "Đang xử lý"; placeholder ví dụ tiếng Anh → tiếng Việt.
- **Phát hiện thêm ngoài báo cáo khảo sát:** 4 vị trí SelectItem "Easy/Medium/Hard" còn tiếng Anh (dòng 2168-2170, 2531-2533) trong khi cùng file đã có 2 vị trí khác dùng đúng "Dễ/Trung bình/Khó" (dòng 1990-1992, 2056) — đúng là kiểu lỗi "cùng 1 file, 2 cách gọi" mà bạn mô tả ban đầu. Đã đồng bộ toàn bộ 6 vị trí. Lần sửa `replace_all` đầu tiên bỏ sót 1 vị trí do khác số khoảng trắng thụt lề — phát hiện qua quét lại bằng grep, đã sửa bổ sung.
- Grep quét toàn diện lần cuối trên `CreateExam.tsx` → không còn chuỗi tiếng Anh hiển thị nào.

**Đã sửa — `FE/src/features/lecturer/AdvancedExamRuleConfig.tsx`** (120 dòng, gần như dịch lại toàn bộ): tiêu đề trang, nút Lưu/Khôi phục, và 6 card (Cài đặt cơ bản đã sẵn Việt, Phân bổ độ khó, Thiết lập trộn đề, Bảo mật & toàn vẹn học thuật, Ngưỡng toàn vẹn học thuật AI, Quy tắc tính điểm, Ngoại tuyến & tự động nộp bài) — toàn bộ label, switch, slider, select option, placeholder.

**Đã sửa — `FE/src/features/lecturer/GenerateExamLink.tsx`** (95 dòng, dịch lại toàn bộ qua Write 1 lần): tiêu đề trang, cấu hình liên kết (bài thi/thời hạn/số lần dùng/mật khẩu/ghi chú), khối URL vừa tạo + QR, bảng liên kết bài thi, bảng nhật ký sử dụng, 2 toast lỗi.
- **Phát hiện thêm ngoài báo cáo khảo sát:** dòng 495-505 truyền `variant` trực tiếp và `children={state}` vào `StatusBadge` (không qua `domain`), khiến cột Trạng thái hiển thị nguyên giá trị biến nội bộ "active"/"disabled"/"expired" bằng tiếng Anh. Đây không nằm trong danh sách dòng báo cáo khảo sát ghi nhận trước đó. Đã thêm bảng `LINK_STATE_LABELS` ánh xạ sang "Hoạt động"/"Đã thu hồi"/"Hết hạn" ngay trong file này (không sửa `status-badge.tsx` vì đây dùng `variant` chứ không dùng `domain`, không phải lỗi chung của component).

**Đã sửa — `FE/src/features/lecturer/ExamPreview.tsx`** (54 dòng): toast chia sẻ bài thi, "Exam not found."/"Back to Exams"/"No course", nút Share/Show QR/View Results/Open Question Bank, dialog Chia sẻ liên kết + dialog Mã QR, badge trạng thái lịch thi (Scheduled/Exam Ended/Exam Ongoing → Đã lên lịch/Đã kết thúc/Đang diễn ra). Phần "Xem trước bài thi", "Câu hỏi", "Sửa câu hỏi" (dòng 394+) đã sẵn tiếng Việt từ trước.

**Kiểm tra grep còn sót** trên cả 4 file → chỉ khớp các chuỗi đã là tiếng Việt.

**Kiểm tra biên dịch:** `npx tsc --noEmit -p FE/tsconfig.app.json` → sạch, không lỗi.

---

## Part 5 — Lecturer: Khóa học & Ngân hàng câu hỏi

Trạng thái: [x] Hoàn thành 2026-08-06 — xem kiểm duyệt bên dưới

File liên quan:
- `FE/src/features/lecturer/CreateCourse.tsx` — đặc biệt dòng 780 vs 851 (2 toast cùng nghĩa khác ngôn ngữ) — chỉ giữ 1 bản Việt
- `FE/src/features/lecturer/CourseDetail.tsx` — tab "Import File" (756), placeholder (768), toast (673-696)
- `FE/src/features/lecturer/QuestionEditor.tsx` — placeholder (489,755), "Đang xác thực"/"lỗi xác thực" (329) → theo glossary "kiểm tra hợp lệ"
- `FE/src/features/lecturer/QuestionBankManagement.tsx` — table header (932,946), heading (1210)
- `FE/src/features/lecturer/QuestionHistoryAnalysis.tsx` — toàn bộ table/heading Anh (358-416)
- `FE/src/features/lecturer/UploadDocAIGen.tsx` — toàn bộ (283-429), "Medium"→"Trung bình"
- `FE/src/features/lecturer/ManualGradingDetail.tsx` — đã tốt, chỉ rà soát theo glossary
- `FE/src/features/lecturer/ExamAnalytics.tsx` — **ưu tiên xử lý lỗi encode** trước (dòng 896,898 HTML entity sai; dòng 567,576,578,613,655,674 mất dấu tiếng Việt), sau đó Việt hóa phần còn thiếu
- `FE/src/features/lecturer/LecturerDashboard.tsx` — "AI Assistant" (199) → "Trợ lý AI"
- `FE/src/features/admin/... ExamQualityReview.tsx` (237) — "AI Assistant" → "Trợ lý AI" (kiểm tra đúng đường dẫn khi vào làm)

### Kiểm duyệt Part 5 (2026-08-06)

Ghi chú vận hành: Part 5 được chạy song song với Part 4 (agent khác). Đã kiểm tra trước khi bắt đầu — danh sách file 2 phần không trùng nhau nên không có rủi ro ghi đè như sự cố ở Part 2.

**Đã sửa — `FE/src/features/lecturer/CreateCourse.tsx`** (60 dòng, `git diff --stat` xác nhận): 6 toast tiếng Anh (create/update/delete course, load full details) dịch sang tiếng Việt; bỏ 3 khối `<span className="hidden">...</span>` chứa bản tiếng Anh trùng lặp với bản tiếng Việt đã hiển thị (dialog "Course Created", nút "Done/Skip"); table header "Student"→"Sinh viên" (2 vị trí, tab thủ công và tab hệ thống đào tạo); placeholder tìm kiếm hệ thống đào tạo; toàn bộ dialog "Edit Course" (title, label Course Code/Academic year/Course Name/Term/Credits/Description, nút Cancel/Save Changes) → tiếng Việt; "No courses found"→"Không tìm thấy khóa học"; `itemLabel="courses"`→"khóa học".

**Đã sửa — `FE/src/features/lecturer/CourseDetail.tsx`** (34 dòng): title trang khi chưa có course; tab "Import File"→"Nhập từ tệp"; DialogDescription; placeholder email/mã sinh viên; nút "Add Student"→"Thêm sinh viên"; 4 toast (add/remove student); placeholder filter mã sinh viên; "No students found..."→tiếng Việt; `itemLabel="students"`→"sinh viên"; ConfirmActionDialog xóa sinh viên (title/description/confirmText/cancelText).

**Đã sửa — `FE/src/features/lecturer/QuestionEditor.tsx`** (64 dòng): lỗi validate "Question text/Course is required"→tiếng Việt; thông báo `toast.error` trước đây dùng "lỗi xác thực" (sai theo glossary) → đổi thành "Vui lòng kiểm tra lại các trường bị lỗi bên dưới." (validate = "Kiểm tra hợp lệ", không phải "xác thực"); heading "Edit Question"/"Loading..."/"Course:"/"Edit an existing question"→tiếng Việt; "AI Assistant"→"Trợ lý AI" (theo glossary); toàn bộ card AI generator, hướng dẫn chọn đáp án, media upload, Course/Topic/Difficulty label → tiếng Việt.

**Đã sửa — `FE/src/features/lecturer/QuestionBankManagement.tsx`** (50 dòng): sr-only "Open"→"Mở", aria-label, "+N more"→"+N loại khác", nút "Analytics"→"Phân tích", FilterPanel title/description, table header (Updated At/Content/Type/Difficulty/Actions)→tiếng Việt, dialog xem trước câu hỏi (Question Preview, Close, Question/Answer/Correct Answer/Explanation section, "Correct answer" badge, "does not use answer options", "No correct/explanation provided") → toàn bộ tiếng Việt.

**Đã sửa — `FE/src/features/lecturer/QuestionHistoryAnalysis.tsx`** (34 dòng): toast lỗi tải lịch sử; "N version(s)"→"N phiên bản"; toàn bộ tab "Difficulty Drift" (heading, table header ID/Question/Course/Initial Diff./Current Diff./Attempts/Trend/Discrim., "No data"); tab "Version History" (heading, "AI-assisted/Initial/Manual version").

**Đã sửa — `FE/src/features/lecturer/UploadDocAIGen.tsx`** (104 dòng, toàn bộ file gần như 100% tiếng Anh trước đó): heading trang, toàn bộ 4 bước (upload/configure/generating/review) — error message trích xuất tệp, toast, label Course/Topic/Number of Questions/Difficulty (Easy/Medium/Hard/Mixed)/Question Type, nút Back/Generate/Regenerate/Approve/Reject, card thống kê Approved/Pending Review/Rejected, cảnh báo duyệt AI trước khi lưu — dịch toàn bộ sang tiếng Việt.

**Đã kiểm tra, không cần sửa:** `FE/src/features/lecturer/ManualGradingDetail.tsx` — rà soát toàn file, xác nhận 100% tiếng Việt, không có `git diff` nào cần thêm (đúng như báo cáo khảo sát ghi nhận "đã tốt").

**Đã sửa — `FE/src/features/lecturer/ExamAnalytics.tsx`** (88 dòng): xử lý lỗi encode trước theo yêu cầu — phát hiện phạm vi lỗi lớn hơn báo cáo khảo sát ban đầu (không chỉ dòng 896,898 mà còn ~25 vị trí khác dùng HTML numeric entity làm hỏng hiển thị tiếng Việt: "Đúng/Sai/Bỏ qua", "Tiến độ theo thời gian", "Tóm tắt AI", "Điểm cần chú ý", "Chủ đề yếu nhất", "Câu hỏi cần rà soát", "Khuyến nghị AI", "Cảnh báo chất lượng câu hỏi", v.v., dòng 696-965); cũng không chỉ 6 dòng mất dấu như báo cáo (567,576,578,613,655,674) mà là toàn bộ khối bộ lọc phân tích bài thi. Sau khi sửa hết lỗi encode/dấu, tiếp tục Việt hóa 7 heading `QuestionReviewCard`/`ComparisonSection` còn tiếng Anh (Question Content/Answer Options/Correct Answer/Explanation, "Correct answer" badge, "does not use answer options", "No correct/explanation provided").

**Đã sửa — `FE/src/features/lecturer/LecturerDashboard.tsx`** (4 dòng): "AI Assistant" (2 vị trí, dòng 199 và trong `HelpedTitle` dòng 547) → "Trợ lý AI".

**Đã sửa — `FE/src/features/lecturer/ExamQualityReview.tsx`** (2 dòng) — file thực tế nằm ở `FE/src/features/lecturer/`, không phải `admin/` như ghi trong báo cáo khảo sát ban đầu: "AI Assistant" (dòng 237) → "Trợ lý AI".

**Kiểm tra grep còn sót** (`>[A-Za-z]...<|placeholder="[A-Za-z]|title="[A-Za-z]` và `&#\d+;`) trên toàn bộ 10 file Part 5 → chỉ còn "Email", "ID" và các placeholder tiếng Việt hợp lệ (bị bắt vì ký tự đầu là Latin hoa "T", "C"...), không còn tiếng Anh hoặc lỗi encode thực sự nào.

**Kiểm tra biên dịch:** `npx tsc --noEmit -p tsconfig.app.json` → `TypeScript: No errors found`, exit code 0.

**Xác nhận không mất chỉnh sửa do chạy song song với Part 4:** `git diff --stat` trên cả 10 file cho thấy đúng số dòng thay đổi tương ứng với các Edit đã thực hiện (215 thêm / 225 xóa trên 9 file có sửa), không có dấu hiệu bị ghi đè.

---

## Part 6 — Student: toàn bộ màn hình

Trạng thái: [x] Hoàn thành 2026-08-06 — xem kiểm duyệt bên dưới

File liên quan:
- `FE/src/features/student/ExamEventTimeline.tsx` — toàn bộ (186-292)
- `FE/src/features/student/grading-template.tsx` — table header (270-274)
- `FE/src/features/student/LearningFeedbackDetail.tsx` — heading/button (63,66,139)
- `FE/src/features/student/FeedbackDetail.tsx` — (149-355)
- `FE/src/features/student/JoinExam.tsx` — label/placeholder (187-314)
- `FE/src/features/student/JoinExamByLink.tsx` — (96-118)
- `FE/src/features/student/ScanQRJoinExam.tsx` — (304,335)
- `FE/src/features/student/ExamReadyCheck.tsx` — **sửa lỗi mất dấu phần webcam** (147,152,156,169)
- Rà soát nhanh nhóm đã tốt: StudentCourseDetail, StudentCourses, StudentSchedule, StudentExams, StudentResults, ExamTaking

### Kiểm duyệt Part 6 (2026-08-06)

**Đã sửa — `FE/src/features/student/ExamReadyCheck.tsx`** (8 dòng): sửa lỗi mất dấu tiếng Việt ở phần webcam đúng như báo cáo khảo sát ghi nhận — dòng 147 "Dang yeu cau quyen truy cap webcam" → "Đang yêu cầu quyền truy cập webcam"; dòng 152 "Webcam da san sang..." → "Webcam đã sẵn sàng..."; dòng 156 "Can cho phep truy cap webcam..." / "Khong the truy cap webcam..." → có dấu đầy đủ; dòng 169 "Webcam bai thi" → "Webcam bài thi". Phần còn lại của file đã sẵn tiếng Việt đầy đủ dấu.

**Đã sửa — `FE/src/features/student/ExamEventTimeline.tsx`** (81 dòng, dịch lại toàn bộ qua Write 1 lần): tiêu đề, mô tả, 4 thẻ thống kê, 3 tab, toàn bộ nội dung 3 tab (nhật ký sự kiện/phát hiện bất thường/ghi chú toàn vẹn).
- **Phát hiện thêm ngoài báo cáo khảo sát (quan trọng):** file này hiển thị `event.description`/`note.note` **thô, không qua dịch**, trong khi 2 file admin dùng chung nguồn dữ liệu backend (`IntegrityOverview.tsx`, `IntegrityCaseDetail.tsx`) đã có sẵn từ điển dịch (`translatePrimarySignal`/`translateEvidence`) cho đúng các chuỗi như "Tab switch detected", "Fullscreen exit detected"... Nếu không sửa, sinh viên sẽ thấy các dòng sự kiện bằng tiếng Anh dù toàn bộ khung UI xung quanh đã là tiếng Việt. Đã thêm hàm `translateEvidence` (sao chép đúng từ điển từ `IntegrityCaseDetail.tsx` để nhất quán) và áp dụng cho `event.description`, `event.detail`, `note.note`, `note.detail`.
- Cũng phát hiện cùng lỗi "children override domain label" như Part 2 ở 2 vị trí `<StatusBadge status={event.severity} domain="severity">{event.severity}</StatusBadge>` — đã bỏ children để dùng nhãn tự động (severity domain đã có sẵn tiếng Việt).

**Đã sửa — `FE/src/features/student/LearningFeedbackDetail.tsx`** (92 dòng, dịch lại toàn bộ): không chỉ 3 dòng như báo cáo khảo sát ghi nhận ban đầu — toàn bộ trang (sidebar, breadcrumb, thẻ điểm, lỗi thường gặp, gợi ý cá nhân hóa) đều là tiếng Anh, đã dịch hết.

**Đã sửa — `FE/src/features/student/FeedbackDetail.tsx`** (107 dòng, dịch lại toàn bộ): tiêu đề, 4 thẻ điểm tóm tắt, phân bổ điểm, phân tích mẫu trả lời, gợi ý cá nhân hóa, lịch sử tiến bộ, trang liên quan — bao gồm cả dữ liệu mock (tên chủ đề, tên bài kiểm tra) để toàn trang nhất quán tiếng Việt.

**Đã sửa — `FE/src/features/student/JoinExam.tsx`** (69 dòng, dịch lại toàn bộ): tiêu đề, 3 bước wizard, toast lỗi, form nhập mã/email/OTP, màn hình xác nhận đăng ký.

**Đã sửa — `FE/src/features/student/JoinExamByLink.tsx`** (33 dòng, dịch lại toàn bộ): thông báo lỗi, tiêu đề, thông tin liên kết, form mật khẩu, nút hành động.

**Đã sửa — `FE/src/features/student/ScanQRJoinExam.tsx`** (49 dòng, dịch lại toàn bộ): tiêu đề, khối quét QR (các trạng thái: đang kiểm tra/không có camera/đang quét/đã phát hiện), nhập mã thủ công, màn hình xác nhận mã.

**Đã kiểm tra, không cần sửa:**
- `FE/src/features/student/grading-template.tsx` — xác nhận bằng `grep -rn "grading-template" src/` là **không có route/import nào trỏ tới file này** (code chết, không hiển thị cho người dùng thật). Theo phạm vi "ưu tiên giao diện hiển thị cho người dùng", không dịch sâu nội dung mock của file này; chỉ ghi nhận ở đây để nếu sau này file được route lại thì cần rà soát tiếp.
- `StudentCourseDetail.tsx`, `StudentCourses.tsx`, `StudentSchedule.tsx`, `StudentExams.tsx`, `StudentResults.tsx`, `ExamTaking.tsx` — quét kỹ bằng nhiều lượt grep (kể cả từ tiếng Anh lẫn giữa câu), chỉ phát hiện các chuỗi tiếng Anh nằm trong code logic (biến trạng thái nội bộ, `console.error` dev log, tên hàm/enum) không hiển thị trực tiếp ra UI — ví dụ `StudentExams.tsx` có hàm `statusText()` trả về "Ongoing"/"Completed" nhưng đây chỉ là key nội bộ, luôn được `statusLabel()` dịch sang "Đang diễn ra"/"Đã hoàn thành" trước khi hiển thị. Không cần sửa theo đúng quy tắc "code không cần tiếng Việt".

**Kiểm tra grep còn sót** trên toàn bộ 7 file đã sửa → không còn chuỗi tiếng Anh hiển thị nào.

**Kiểm tra biên dịch:** `npx tsc --noEmit -p FE/tsconfig.app.json` → sạch, không lỗi.

---

## Part 7 — Component dùng chung (common/ui/layout)

Trạng thái: [x] Hoàn thành 2026-08-06 — xem kiểm duyệt bên dưới

File liên quan:
- `FE/src/components/common/BulkStudentImport.tsx` — table header, loading state Anh (452,531,581-583,632)
- `FE/src/components/common/BackToDashboardButton.tsx` — rà soát nơi dùng (đã Việt, chỉ đảm bảo trang cha đồng bộ sau khi Part 6 xong)
- `FE/src/components/common/list/FilterPanel.tsx` — placeholder "Min" (424)
- `FE/src/components/ui/carousel.tsx` — "Previous slide"/"Next slide" (191,219) → Việt hóa sr-only
- `FE/src/components/ui/dialog.tsx`, `FE/src/components/ui/sheet.tsx` — "Close" (52,64) → Việt hóa sr-only
- `FE/src/components/ui/pagination.tsx` — "Previous"/"Next" (54,61) → Việt hóa sr-only

### Kiểm duyệt Part 7 (2026-08-06)

**Đã sửa — `FE/src/components/common/BulkStudentImport.tsx`** (~20 vị trí): 3 message validate dòng dữ liệu ("Student ID is required"/"Full name is required"/"Department is required" → "Mã sinh viên là bắt buộc"/"Họ và tên là bắt buộc"/"Khoa là bắt buộc"); khối kéo-thả file ("Drag & drop file here"/"Supports CSV, Excel (.xlsx, .xls)"/"Browse File" → "Kéo thả tệp vào đây"/"Hỗ trợ CSV, Excel (.xlsx, .xls)"/"Chọn tệp"); "Supported columns:" → "Các cột được hỗ trợ:"; nút "Template" → "Mẫu"; "Validating..."/"Validate & Preview" → "Đang kiểm tra..."/"Kiểm tra & Xem trước"; "Parsing and validating file..." → "Đang đọc và kiểm tra tệp..."; 2 thẻ tóm tắt "Valid rows"/"Error rows" → "Dòng hợp lệ"/"Dòng lỗi"; "{n} error(s) found" → "Tìm thấy {n} lỗi"; table header lỗi Row/Error → Dòng/Lỗi (giữ "Email"); "{n} valid row(s) ready to import" → "{n} dòng hợp lệ sẵn sàng để import"; table header preview Row/Student ID/Full Name/Department → Dòng/Mã sinh viên/Họ và tên/Khoa (giữ "Email"); "Importing students..."/"This may take a moment for large files" → "Đang import sinh viên..."/"Có thể mất một chút thời gian với tệp lớn" (giữ nguyên từ "Import" dùng xuyên suốt file như quy ước sẵn có, ví dụ "Import hoàn tất thành công!", "Import thất bại").

**Đã sửa — `FE/src/components/common/list/FilterPanel.tsx`** (1 dòng): dòng 424 `placeholder="Min"` (nhánh có slider) → `"Tối thiểu"`, đồng bộ với nhánh không-slider bên dưới đã đúng từ trước.

**Đã sửa — `FE/src/components/ui/carousel.tsx`** (2 dòng sr-only, bản gốc shadcn): "Previous slide" → "Slide trước", "Next slide" → "Slide tiếp theo".

**Đã sửa — `FE/src/components/ui/dialog.tsx`, `FE/src/components/ui/sheet.tsx`** (mỗi file 1 dòng sr-only): "Close" → "Đóng".

**Đã sửa — `FE/src/components/ui/pagination.tsx`** (4 vị trí, phát hiện thêm ngoài mô tả gốc của báo cáo khảo sát): text hiển thị "Previous"/"Next" → "Trước"/"Tiếp"; `aria-label="Go to previous page"`/`"Go to next page"` → "Về trang trước"/"Đến trang sau"; sr-only "More pages" → "Còn nhiều trang khác". Giữ nguyên `aria-label="pagination"` ở thẻ `<nav>` — đây là ARIA landmark kỹ thuật (giá trị chuẩn, không hiển thị cho người dùng thông thường), không phải text UI cần dịch.

**Đã kiểm tra, không cần sửa:**
- `FE/src/components/common/BackToDashboardButton.tsx` — 100% tiếng Việt (label mặc định "Quay lại tổng quan"), không có chuỗi Anh.

**Grep xác nhận không còn sót** (`grep -nE '>[A-Za-z][A-Za-z0-9 ,().%/+-]*[A-Za-z]<|placeholder="[A-Za-z]|aria-label="[A-Za-z]'` trên cả 7 file) → chỉ còn "Email" (2 vị trí, giữ nguyên theo chuẩn quốc tế) và `aria-label="pagination"` (ARIA landmark kỹ thuật, giữ nguyên có chủ đích) — không còn chuỗi tiếng Anh hiển thị nào sót.

**Kiểm tra biên dịch:** `npx tsc --noEmit -p FE/tsconfig.app.json` → sạch, không lỗi.

---

## Part 8 — Rà soát toàn bộ lần cuối (Final Review)

Trạng thái: [x] Hoàn thành 2026-08-06 — xem kiểm duyệt bên dưới

Nội dung:
1. Grep toàn bộ `FE/src` tìm chuỗi tiếng Anh còn sót trong JSX text/label/placeholder/toast (dựa trên pattern chữ cái Latin liên tục không dấu trong ngoặc kép/JSX text).
2. Kiểm tra lại toàn bộ bảng Glossary — đảm bảo áp dụng nhất quán 100% (Sửa, Đăng nhập, Kiểm tra hợp lệ, Xác nhận, Dễ/Trung bình/Khó, Trợ lý AI).
3. Kiểm tra không còn lỗi encode HTML entity hoặc tiếng Việt mất dấu.
4. Chạy `npm run build` toàn FE để xác nhận không phá vỡ gì.
5. Báo cáo tổng kết có bằng chứng: số file đã sửa, số dòng, danh sách các mục grep còn lại (nếu có) cần theo dõi thêm.

### Kiểm duyệt Part 8 (2026-08-06)

**Bối cảnh:** nhiều agent chạy song song trong quá trình thực hiện Part 1-7 (Part 4/5 chạy đồng thời, Part 7 do agent khác tự chạy tiếp sau Part 5). Người dùng yêu cầu vừa "dò lại" tất cả các Part trước vừa chạy Part 8, do nghi ngờ trạng thái/file có thể bị mất do đụng độ giữa các agent.

**1. Xác nhận `git diff --stat` cho toàn bộ ~40 file đã được các Part 1-7 khai báo sửa** (so với danh sách ghi trong từng mục "Kiểm duyệt Part N"):
- **Phát hiện sự cố:** `FE/src/features/Login.tsx` (sửa ở Part 1) đã bị **revert hoàn toàn về bản gốc** — cả 2 sửa đổi ("Đăng Nhập ExamTrust" → "Đăng nhập ExamTrust" và "Đang xác thực" → "Đang đăng nhập") đều mất, `git diff` cho file này trống. Đây là sự cố ghi đè âm thầm thứ 2 được phát hiện trong toàn bộ quá trình (lần 1 ở Part 2 với `UserRoleManagement.tsx`, có cảnh báo từ Edit tool; lần này ở Login.tsx thì **không có cảnh báo nào**, chỉ phát hiện được nhờ quét lại chủ động theo yêu cầu của người dùng). Đã sửa lại và xác nhận `git diff --stat` ngay: `FE/src/features/Login.tsx | 4 ++--`.
- Tất cả file còn lại (~39 file) của Part 1-7 đều có `git diff` đúng số dòng đã ghi trong log kiểm duyệt tương ứng — không phát hiện thêm trường hợp bị mất nào khác.

**2. Quét mở rộng ra các khu vực chưa từng được liệt kê ở Part nào (Part 1-7 chỉ liệt kê theo báo cáo khảo sát ban đầu, có thể sót file):**
- Rà toàn bộ `features/admin/*.tsx`, `features/lecturer/*.tsx`, `features/student/*.tsx`, `components/layout`, `components/admin`, `components/ui`, `components/common`, `exam-engine`, `contexts`, `hooks`, `app/`.
- **Phát hiện lỗ hổng thật — 2 file chưa từng được Part nào chỉnh sửa:**
  - `FE/src/features/lecturer/ExamManagement.tsx` — **khác với `admin/ExamManagement.tsx`** (đã sửa ở Part 3) và khác với các file `CreateExam.tsx`/`AdvancedExamRuleConfig.tsx` (Part 4). File này là màn "Quản lý bài thi" riêng của giảng viên, có 9 toast tiếng Anh (xóa/cập nhật/đổi lịch bài thi) và 1 dòng "Loading exams..." — đã dịch toàn bộ (20 dòng thay đổi). Phần còn lại của file (~95%) đã sẵn tiếng Việt từ trước nên không bị lộ trong báo cáo khảo sát gốc (báo cáo chỉ liệt kê `lecturer/ExamManagement.tsx` một cách mơ hồ ở Part 4 "nếu khác file admin, kiểm tra riêng" nhưng không có Part nào thực sự làm).
  - `FE/src/components/ui/sidebar.tsx` — `aria-label`/`title="Toggle Sidebar"` chưa dịch (2 dòng). Xác nhận component này **không được import ở đâu trong codebase** (`grep -rl` không ra kết quả) — tương tự `grading-template.tsx`, đây là code chết (app dùng sidebar tự viết riêng trong `DashboardLayout.tsx`, không dùng component shadcn này). Vẫn sửa vì chi phí thấp (2 dòng).
- Không phát hiện thêm file nào khác bị sót.

**3. Kiểm tra glossary nhất quán trên toàn bộ `FE/src`:**
- `grep -rn "Chỉnh sửa"` → không có kết quả (đúng, không dùng biến thể này, chỉ dùng "Sửa").
- `grep -rn "AI Assistant"` → không có kết quả (đã Việt hóa hết thành "Trợ lý AI").
- `grep -rnE '>(Easy|Medium|Hard)<'` → không có kết quả (đã Việt hóa hết thành Dễ/Trung bình/Khó).
- `grep -rn "[Xx]ác thực"` → chỉ còn 3 vị trí, cả 3 đều đúng nghĩa authenticate theo glossary: `SystemPolicyConfig.tsx:436,438` ("Xác thực hai yếu tố" — đúng vì 2FA là cơ chế đăng nhập) và không còn vị trí sai nghĩa nào (trước đây có `Login.tsx:167` và `QuestionEditor.tsx:329` dùng sai cho nghĩa authenticate/validate, cả 2 đã được sửa ở Part 1 và Part 5).

**4. Kiểm tra lỗi encode/mất dấu trên toàn bộ `FE/src`:**
- `grep -rnE '&#[0-9]+;'` (HTML numeric entity) → không có kết quả trên toàn bộ codebase (xác nhận Part 5 đã xử lý triệt để lỗi encode ở `ExamAnalytics.tsx`, không còn sót ở file nào khác).
- Quét các từ khóa tiếng Việt mất dấu đặc trưng (`khong the`, `khong tim`, `da san sang`, `thanh cong`, `nguoi dung`, `vui long`, `yeu cau`, `da luu`, `da xoa`, `khong hop le`) trên toàn bộ `.tsx` → không có kết quả (xác nhận lỗi mất dấu chỉ tồn tại ở `ExamReadyCheck.tsx` như đã sửa ở Part 6, không lan ra file khác).

**5. Grep tổng quét cuối cùng toàn bộ `FE/src`** (pattern JSX text/placeholder/toast/title/label bắt đầu bằng chữ hoa Latin, loại trừ `grading-template.tsx` đã xác nhận là code chết) → toàn bộ kết quả trả về đều là chuỗi tiếng Việt hợp lệ (bị bắt vì ký tự đầu là chữ Latin hoa, ví dụ "Email", "Khoa", tên biến trong toast đã dịch) — không còn chuỗi tiếng Anh hiển thị thực sự nào trong toàn bộ ứng dụng FE.

**6. Kiểm tra biên dịch & build:**
- `npx tsc --noEmit -p FE/tsconfig.app.json` → sạch, không lỗi.
- `npm run build` (Next.js production build, toàn bộ ~68 route) → **build thành công**, tất cả route compile không lỗi, kích thước bundle bình thường.

**Tổng kết phạm vi đã xử lý toàn bộ dự án (Part 0-8):**
- Đã Việt hóa hoàn toàn khu vực Auth/Layout chung, toàn bộ Admin (Users, Settings, Audit, Transparency, Course, Exam, Analytics, Integrity), toàn bộ Lecturer (CreateExam, cấu hình bài thi, chia sẻ link, khóa học, ngân hàng câu hỏi, phân tích, quản lý bài thi), toàn bộ Student (join/scan QR, kiểm tra điều kiện dự thi, dòng thời gian sự kiện, phản hồi học tập), và các component dùng chung (BulkStudentImport, FilterPanel, carousel/dialog/sheet/pagination/sidebar).
- Đã sửa 3 lỗi kỹ thuật phát sinh ngoài phạm vi dịch thuật đơn thuần: (a) lỗi mất dấu tiếng Việt ở `ExamReadyCheck.tsx` và toàn bộ `ExamAnalytics.tsx`; (b) lỗi encode HTML entity ở `ExamAnalytics.tsx`; (c) lỗi "children override domain label" khiến `StatusBadge` hiển thị tiếng Anh thô dù đã có bản dịch — xảy ra lặp lại ở ít nhất 3 file khác nhau (`UserRoleManagement.tsx`, `AuditLogViewer.tsx`, `ExamEventTimeline.tsx`) và 1 biến thể dùng `variant`+`children` ở `GenerateExamLink.tsx`.
- Đã xác nhận và khắc phục 2 sự cố ghi đè file âm thầm do chạy nhiều agent song song (`UserRoleManagement.tsx` ở Part 2, `Login.tsx` phát hiện ở Part 8) — khuyến nghị nếu tiếp tục dùng nhiều agent song song trong tương lai, nên chạy `git diff --stat` xác nhận ngay sau mỗi lần sửa file quan trọng, không chỉ tin vào kết quả trả về của tool.
- Phạm vi không dịch (có chủ đích, đã ghi chú rõ lý do): `grading-template.tsx` và `components/ui/sidebar.tsx` — cả 2 đều là code chết, không có route/import nào trỏ tới, không hiển thị cho người dùng thật.
- Backend (`BE/`) vẫn ngoài phạm vi theo đúng yêu cầu ban đầu "ưu tiên FE trước".

---

## Ghi chú phạm vi

- Backend (`BE/`) chưa nằm trong kế hoạch này — theo yêu cầu "Ưu tiên FE trước". Sẽ khảo sát riêng sau khi FE hoàn tất nếu cần.
