# Together Diary

Web app nhật ký cá nhân: đăng nhập/đăng ký, soạn nhật ký rich-text theo ngày
(đậm/nghiêng/gạch chân/viết hoa-thường/căn lề), paste ảnh trực tiếp bằng
Ctrl+V, chọn màu/ảnh nền riêng cho từng ngày, và lịch tháng để nhảy nhanh
giữa các ngày đã viết/chưa viết.

Thiết kế theo plan: [docs/superpowers/plans/2026-10-26-together-diary-implementation.md](docs/superpowers/plans/2026-10-26-together-diary-implementation.md).
Mockup layout gốc: [mockups/](mockups).

## Tech stack

- Next.js 16 (App Router, TypeScript) + Tailwind CSS
- PostgreSQL qua Prisma (ghim ở Prisma 6.19.3 — Prisma 7 đổi sang yêu cầu
  `prisma.config.ts` + driver adapter)
- TipTap (rich-text editor)
- NextAuth.js (Credentials provider, JWT session)
- SeaweedFS S3 gateway (lưu ảnh paste/nền — thay cho MinIO, vì MinIO đã khoá
  tải Docker image/binary miễn phí kể từ 2026)

## Chạy dev

1. Copy `.env.example` thành `.env` (giá trị mặc định đã khớp với
   `docker-compose.dev.yml`).
2. Bật Postgres + SeaweedFS:

   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```

3. Cài dependency và chạy migration:

   ```bash
   npm install
   npx prisma migrate dev
   ```

4. Chạy dev server:

   ```bash
   npm run dev
   ```

   Mở [http://localhost:3000](http://localhost:3000).

5. Chạy test:

   ```bash
   npm run test
   ```

> Lưu ý: SeaweedFS (all-in-one single-node) mất khoảng 10-15 giây để bầu lại
> raft leader sau mỗi lần restart container — nếu upload/xem ảnh trả về lỗi
> ngay sau khi restart `object-storage`, đợi vài giây rồi thử lại.

## Deploy lên VPS

1. Clone repo lên VPS, copy `.env.example` → `.env` và điền giá trị thật:
   - `NEXTAUTH_SECRET`: chuỗi ngẫu nhiên dài (`openssl rand -base64 32`).
   - `NEXTAUTH_URL`: domain thật, có `https://`.
   - `MINIO_ENDPOINT`: `http://127.0.0.1:9000` (nội bộ, app gọi S3 API).
   - `MINIO_PUBLIC_URL`: `https://your-domain.example/media` (trình duyệt
     dùng để tải ảnh, đi qua Nginx — xem `deploy/nginx.conf`).
   - `POSTGRES_PASSWORD` (dùng bởi `docker-compose.prod.yml`).

2. Bật Postgres + SeaweedFS:

   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```

3. Cài dependency, chạy migration, build:

   ```bash
   npm install
   npx prisma migrate deploy
   npm run build
   ```

4. Chạy app bằng PM2:

   ```bash
   npm install -g pm2
   pm2 start ecosystem.config.js
   pm2 save
   ```

5. Cấu hình Nginx: copy `deploy/nginx.conf` vào
   `/etc/nginx/sites-available/together-diary`, sửa `server_name`, symlink
   vào `sites-enabled`, `nginx -t && systemctl reload nginx`, rồi chạy
   `certbot --nginx` để bật HTTPS.

6. Cấu hình bucket SeaweedFS đã có sẵn trong
   `deploy/seaweedfs-s3-config.json` (một identity có quyền Admin/Read/Write
   cho app, một identity `anonymous` chỉ có quyền `Read` để ảnh xem được công
   khai qua URL). Đổi `accessKey`/`secretKey` trước khi deploy thật và cập
   nhật `MINIO_ACCESS_KEY`/`MINIO_SECRET_KEY` trong `.env` cho khớp.
