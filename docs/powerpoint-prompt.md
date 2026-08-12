# Prompt tạo PowerPoint: ExamTrust - Nền tảng thi trực tuyến tích hợp AI

## YÊU CẦU
Tạo một bài PowerPoint **dưới 10 slide**, ngôn ngữ **tiếng Việt**, tập trung vào:
1. **State-of-the-art**: Các giải pháp hiện có trên thị trường
2. **So sánh ưu/nhược điểm**: Moodle Quiz, Safe Exam Browser, ProctorU/Honorlock
3. **Nâng cao ưu điểm của ExamTrust**: AI + Xử lý sai phạm
4. **Human-in-the-loop**: Cách ExamTrust xử lý gian lận thông minh hơn đối thủ

---

## SLIDE 1: TIÊU ĐỀ
**ExamTrust: Nền tảng thi trực tuyến thông minh với AI và giám sát toàn vẹn**

- Học viên: [Tên]
- Giảng viên hướng dẫn: [Tên]
- Năm 2026

---

## SLIDE 2: BỐI CẢNH & BÀI TOÁN
**Tiêu đề: Thực trạng thi trực tuyến hiện nay**

- Chuyển đổi số trong giáo dục: thi online không chỉ dành cho học từ xa mà còn phổ biến ở lớp học truyền thống
- **Vấn đề chính**:
  - Giảng viên phải dùng nhiều công cụ rời rạc: soạn câu hỏi (Word) → tổ chức thi (Google Form/Moodle) → chấm điểm (Excel) → báo cáo (thủ công)
  - Dữ liệu phân mảnh, không truy vết được
  - Gian lận trong thi online là vấn đề nghiêm trọng: chuyển tab, thoát fullscreen, dùng điện thoại, copy-paste...
  - AI tạo câu hỏi đang phát triển nhưng chất lượng không đồng đều (Kurdi et al. 2020, Scaria et al. 2024)

- **Câu hỏi nghiên cứu**: Làm sao xây dựng một nền tảng ALL-IN-ONE vừa hỗ trợ toàn bộ vòng đời bài thi, vừa tích hợp AI một cách có trách nhiệm?

---

## SLIDE 3: STATE OF THE ART - CÁC GIẢI PHÁP HIỆN CÓ
**Tiêu đề: Các nền tảng thi trực tuyến trên thị trường**

Chia làm 3 nhóm chính:

| Nhóm | Đại diện | Đặc điểm |
|---|---|---|
| **LMS tích hợp** | Moodle Quiz | Question bank, grading, reports - nhưng là hệ sinh thái LMS tổng quát |
| **Lockdown Browser** | Safe Exam Browser (SEB) | Khóa môi trường thi - cần cài đặt, xâm phạm OS |
| **Proctoring dịch vụ** | ProctorU, Honorlock | Live proctor + AI - chi phí cao (~$15-30/sv), bên thứ 3 |

**Điểm chung của các giải pháp hiện có**:
- ❌ Không có AI tạo câu hỏi tích hợp
- ❌ Không có AI đánh giá chất lượng đề thi
- ❌ Proctoring hoặc quá xâm phạm (SEB) hoặc quá đắt (ProctorU)
- ❌ Workflow rời rạc: phải ghép nhiều công cụ

---

## SLIDE 4: SO SÁNH CHI TIẾT - BẢNG ĐỐI CHIẾU
**Tiêu đề: ExamTrust vs. Các giải pháp hiện có**

| Tiêu chí | Moodle Quiz | Safe Exam Browser | ProctorU | **ExamTrust** |
|---|---|---|---|---|
| **Quản lý câu hỏi** | ✅ Ngân hàng, phiên bản | ❌ Không hỗ trợ | ❌ Không hỗ trợ | ✅ **Ngân hàng + metadata + AI tạo** |
| **AI tạo câu hỏi** | ❌ | ❌ | ❌ | ✅ **7 loại, multi-model** |
| **AI đánh giá đề** | ❌ | ❌ | ❌ | ✅ **Discrimination index, difficulty** |
| **Giám sát thi** | ⚠️ Cần plugin | ✅ Lockdown OS | ✅ Live + AI | ✅ **Browser-based, 10 event types** |
| **Phân tích rủi ro AI** | ❌ | ❌ | ⚠️ Có nhưng đắt | ✅ **Dual-layer: rule + AI** |
| **Webcam evidence** | ⚠️ Plugin bên thứ 3 | ❌ | ✅ Bên thứ 3 xem | ✅ **Tự lưu trữ, AI phân tích** |
| **Chi phí** | Miễn phí (tự host) | Miễn phí | ~$15-30/sv/kỳ | **Miễn phí, self-hosted** |
| **Cài đặt** | Cần server PHP | Cần cài app desktop | Plugin browser | **Chỉ cần browser** |
| **Quyền riêng tư** | Tự kiểm soát | Xâm phạm OS | Bên thứ 3 | **Privacy-first, local storage** |
| **Ngôn ngữ** | Đa ngôn ngữ | Tiếng Anh | Tiếng Anh | **Tiếng Việt mặc định** |

---

## SLIDE 5: KIẾN TRÚC AI CỦA EXAMTRUST
**Tiêu đề: Hệ thống AI đa nhà cung cấp - Linh hoạt & Có trách nhiệm**

```
┌─────────────────────────────────────────────────────────┐
│                   AI PROVIDERS                           │
│  Google Gemini │ Ollama (local) │ NVIDIA │ OpenRouter │ DeepSeek │
└──────────────────────┬──────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
   ┌──────────┐ ┌───────────┐ ┌──────────────┐
   │ Tạo câu  │ │ Đánh giá  │ │ Đánh giá rủi │
   │   hỏi    │ │ chất lượng│ │  ro gian lận │
   │ 7 loại   │ │   đề thi  │ │  9 signals   │
   └──────────┘ └───────────┘ └──────────────┘
         │             │             │
         └─────────────┼─────────────┘
                       ▼
         ┌─────────────────────────┐
         │   HUMAN-IN-THE-LOOP     │
         │  Giảng viên QUYẾT ĐỊNH  │
         │   (không phải AI)       │
         └─────────────────────────┘
```

**Nguyên tắc cốt lõi**: "AI gợi ý - Con người quyết định"
- AI không bao giờ kết luận "sinh viên gian lận"
- AI chỉ đưa ra tín hiệu tham khảo (advisory evidence)
- Mọi quyết định cuối cùng thuộc về giảng viên

---

## SLIDE 6: CƠ CHẾ PHÁT HIỆN & XỬ LÝ SAI PHẠM
**Tiêu đề: Quy trình giám sát toàn vẹn - 3 tầng bảo vệ**

**Tầng 1 - Ghi nhận sự kiện (Browser-based, không xâm phạm)**:
- 🔴 Fullscreen exit, Tab switch, Window blur
- 🟡 Copy, Paste bất thường
- 🟢 Mouse idle, Camera stream ended
- **10 loại sự kiện**, severity: high/medium/low

**Tầng 2 - AI Risk Assessment (Phân tích thông minh)**:
- 9 chỉ số đầu vào → Risk Score 0-100
- Risk Level: LOW (<35) | MEDIUM (35-69) | HIGH (70+)
- Mỗi signal có weight riêng
- **Bắt buộc recommendReview cho MEDIUM/HIGH**

**Tầng 3 - Human Review (Giảng viên quyết định)**:
- Xem timeline sự kiện + ảnh webcam
- Quyết định: ✅ Reviewed | ❌ Dismissed | ⚠️ Confirmed
- Penalty: trừ % điểm (10/25/50/100%) hoặc trừ điểm cố định
- **Full audit trail**: mọi thay đổi đều được ghi log

---

## SLIDE 7: AI PHÂN TÍCH ẢNH WEBCAM
**Tiêu đề: Giám sát webcam thông minh - Privacy-first**

**Flow**:
```
Sự kiện nghi vấn → Chụp ảnh webcam → AI Vision phân tích → Tags tham khảo → Giảng viên xem xét
```

**9 loại tag AI phát hiện**:
| Tag | Ý nghĩa |
|---|---|
| FACE_NOT_VISIBLE | Không thấy khuôn mặt |
| MULTIPLE_PEOPLE | Nhiều người trong khung hình |
| CAMERA_COVERED_OR_DARK | Camera bị che/tối |
| POSSIBLE_PHONE | Nghi ngờ dùng điện thoại |
| PROHIBITED_MATERIAL_VISIBLE | Thấy tài liệu cấm |
| ... | ... |

**Khác biệt với ProctorU/Honorlock**:
- ❌ ProctorU: Người lạ (proctor) xem webcam của sinh viên → **xâm phạm quyền riêng tư**
- ✅ ExamTrust: Ảnh lưu **local**, AI phân tích **tự động**, chỉ giảng viên (người trong trường) mới xem được
- Tự động xóa sau 30 ngày

---

## SLIDE 8: ƯU ĐIỂM VƯỢT TRỘI CỦA EXAMTRUST
**Tiêu đề: Tại sao chọn ExamTrust?**

| # | Ưu điểm | Chi tiết |
|---|---|---|
| 1 | **All-in-One** | Question Bank → AI Generation → Exam → Proctoring → Grading → Analytics |
| 2 | **AI có trách nhiệm** | Human-in-the-loop, AI không tự động kết luận gian lận |
| 3 | **Không xâm phạm** | Browser-based, không cần cài app, không can thiệp OS |
| 4 | **Privacy-first** | Webcam lưu local, tự động purge, không bên thứ 3 |
| 5 | **Chi phí thấp** | Self-hosted, hỗ trợ Ollama offline - không phụ thuộc API bên ngoài |
| 6 | **Tiếng Việt** | Mặc định tiếng Việt, prompt AI tối ưu cho nội dung tiếng Việt |
| 7 | **Multi-provider AI** | 5 nhà cung cấp, dễ dàng chuyển đổi, không bị khóa nhà cung cấp |
| 8 | **Audit trail** | Mọi quyết định penalty đều có log, truy vết đầy đủ |

---

## SLIDE 9: KẾT QUẢ & MINH CHỨNG
**Tiêu đề: Kết quả triển khai**

*(Điền số liệu thực tế nếu có)*

- **Chức năng đã hoàn thiện**:
  - ✅ Auth + RBAC (Student, Lecturer, Admin)
  - ✅ Course & Enrollment management
  - ✅ Question Bank (7 loại câu hỏi, versioning, topics)
  - ✅ AI Question Generation (multi-model)
  - ✅ AI Quality Review (discrimination index)
  - ✅ Exam taking với proctoring (10 event types)
  - ✅ Auto-grading + Manual grading
  - ✅ AI Risk Assessment (9 signals, dual-layer)
  - ✅ Webcam evidence + AI analysis (9 visual tags)
  - ✅ Integrity review workflow + Penalty system
  - ✅ Analytics dashboard
  - ✅ Audit logging

- **Công nghệ**: NestJS + Next.js + Prisma + MySQL + Redis + Docker + Cloudflare R2

---

## SLIDE 10: KẾT LUẬN & HƯỚNG PHÁT TRIỂN
**Tiêu đề: Kết luận**

**Đóng góp chính**:
1. Xây dựng nền tảng thi trực tuyến **all-in-one** tích hợp AI có trách nhiệm
2. Cơ chế giám sát **3 tầng** (event → AI → human) - cân bằng giữa bảo mật và quyền riêng tư
3. **Human-in-the-loop**: AI hỗ trợ, con người quyết định - phù hợp với giáo dục
4. **Privacy-first**: Tự lưu trữ, không bên thứ 3, phù hợp với quy định bảo vệ dữ liệu

**Hướng phát triển**:
- Tích hợp thêm model AI (GPT-4V, Claude Vision)
- Mở rộng phân tích hành vi (keystroke dynamics, mouse pattern)
- Hỗ trợ nhiều ngôn ngữ hơn
- Mobile app cho sinh viên
- Blockchain cho chứng chỉ thi

---

## YÊU CẦU THIẾT KẾ
- **Màu sắc**: Tông xanh dương + trắng (chuyên nghiệp, giáo dục)
- **Font**: Roboto / Inter (sạch, hiện đại)
- **Biểu đồ**: Dùng bảng so sánh (Slide 4), sơ đồ kiến trúc (Slide 5, 6)
- **Icon**: Dùng icon cho từng mục để trực quan
- **Không quá nhiều chữ**: Mỗi slide tối đa 5-7 bullet points
- **Slide 4 (bảng so sánh)**: Dùng màu xanh lá cho ✅ ExamTrust, màu đỏ/xám cho ❌ đối thủ
- **Slide 6 (quy trình)**: Dùng sơ đồ flow ngang hoặc dọc