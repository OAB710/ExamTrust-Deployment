# Zalo Bot -> Lambda -> GitHub Actions -> deploy FE

Nhắn "build fe" cho bot Zalo -> Lambda này verify người gửi -> gọi GitHub API
trigger workflow `.github/workflows/deploy-fe.yml` -> workflow đó merge code
mới nhất từ upstream vào fork rồi build + deploy FE lên Cloudflare Workers.

## 1. Tạo bot Zalo, lấy BOT_TOKEN

Theo hướng dẫn https://bot.zapps.me/docs/ (mục Getting Started) để tạo bot,
lấy `BOT_TOKEN`.

Tự nghĩ một chuỗi bí mật 8-256 ký tự bất kỳ, gọi là `ZALO_WEBHOOK_SECRET`
(dùng lại ở bước 3 và bước 5).

## 2. Deploy Lambda (AWS Console, không cần AWS CLI)

1. Nén code: trong thư mục này chạy (PowerShell):
   ```powershell
   Compress-Archive -Path index.mjs -DestinationPath function.zip -Force
   ```
2. Vào AWS Console -> Lambda -> Create function
   - Author from scratch
   - Function name: `zalo-webhook-build-fe`
   - Runtime: **Node.js 22.x** (hoặc bản mới nhất có sẵn — code chỉ cần Node >=18 vì dùng `fetch` toàn cục)
   - Architecture: x86_64 (mặc định)
   - Execution role: "Create a new role with basic Lambda permissions" (mặc
     định, không cần quyền gì thêm — function chỉ gọi HTTPS ra ngoài qua
     `fetch`, không đụng service AWS nào khác)
3. Sau khi tạo xong, vào tab **Code** -> Upload from -> .zip file -> chọn
   `function.zip` vừa nén. Kiểm tra **Runtime settings -> Handler** phải là
   `index.handler`.
4. Tab **Configuration -> Environment variables** -> Add:
   - `ZALO_WEBHOOK_SECRET` = chuỗi bí mật ở bước 1
   - `ZALO_ALLOWED_USER_ID` = để tạm giá trị bất kỳ, sẽ cập nhật đúng ở bước 4
   - `GITHUB_PAT` = personal access token ở bước 5
   - `GITHUB_REPO` = `OAB710/ExamTrust-Deployment` (mặc định trong code, có
     thể bỏ qua nếu đúng)
   - `GITHUB_WORKFLOW_FILE` = `deploy-fe.yml` (mặc định trong code, có thể
     bỏ qua)
5. Tab **Configuration -> Function URL** -> Create function URL
   - Auth type: **NONE** (bắt buộc để Zalo gọi được trực tiếp; bảo mật dựa
     vào việc verify `ZALO_WEBHOOK_SECRET` + `ZALO_ALLOWED_USER_ID` ngay
     trong code, không phải IAM)
   - Copy Function URL (dạng `https://xxxx.lambda-url.<region>.on.aws/`)

## 3. Đăng ký webhook với Zalo

Chạy (thay `<BOT_TOKEN>`, `<FUNCTION_URL>`, `<SECRET>`):
```bash
curl -X POST "https://bot-api.zaloplatforms.com/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "<FUNCTION_URL>", "secret_token": "<SECRET>"}'
```

## 4. Lấy đúng ZALO_ALLOWED_USER_ID

Nhắn thử 1 tin bất kỳ cho bot từ điện thoại của bạn, rồi xem CloudWatch Logs
của Lambda (tab **Monitor -> View CloudWatch logs**) — dòng log
`Rejected: unknown sender <id>` sẽ cho biết đúng `id` của bạn. Copy giá trị
đó, quay lại **Configuration -> Environment variables**, sửa
`ZALO_ALLOWED_USER_ID` = giá trị vừa lấy được, **Save** (Lambda tự áp dụng
ngay, không cần deploy lại code).

## 5. Tạo GitHub PAT + secrets

1. GitHub -> Settings -> Developer settings -> Personal access tokens ->
   Fine-grained tokens -> Generate new token
   - Repository access: chỉ chọn `OAB710/ExamTrust-Deployment`
   - Permissions: **Actions: Read and write**
   - Copy token, dán vào env var `GITHUB_PAT` của Lambda (bước 2.4)
2. Repo `OAB710/ExamTrust-Deployment` -> Settings -> Secrets and variables ->
   Actions -> New repository secret:
   - `CLOUDFLARE_API_TOKEN`: tạo ở Cloudflare dashboard -> My Profile -> API
     Tokens, quyền `Account.Workers Scripts:Edit`
   - `CLOUDFLARE_ACCOUNT_ID`: `01d1ca8a9cdddbd927df55d1dbd62924`

## 6. Test

Nhắn "build fe" cho bot từ đúng tài khoản Zalo (đã set ở bước 4) -> vào tab
**Actions** của repo GitHub, xác nhận workflow "Deploy FE" chạy và thành
công -> kiểm tra domain FE production đã cập nhật code mới nhất.

Nhắn từ tài khoản khác, hoặc câu chữ khác "build fe" -> xem log Lambda xác
nhận bị reject, workflow KHÔNG chạy.
