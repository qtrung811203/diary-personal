# Together Diary

Web app nhật ký cá nhân: đăng nhập/đăng ký, soạn nhật ký rich-text theo ngày
(đậm/nghiêng/gạch chân/viết hoa-thường/căn lề), paste ảnh trực tiếp bằng
Ctrl+V, chọn màu/ảnh nền riêng cho từng ngày (màu pastel có sẵn hoặc tự chọn
màu), và lịch tháng để nhảy nhanh giữa các ngày đã viết/chưa viết.

Thiết kế theo plan: [docs/superpowers/plans/2026-10-26-together-diary-implementation.md](docs/superpowers/plans/2026-10-26-together-diary-implementation.md).
Mockup layout gốc: [mockups/](mockups).

## Tech stack

- Next.js 16 (App Router, TypeScript) + Tailwind CSS
- PostgreSQL qua Prisma (ghim ở Prisma 6.19.3 — Prisma 7 đổi sang yêu cầu
  `prisma.config.ts` + driver adapter)
- TipTap (rich-text editor, font Lora)
- NextAuth.js (Credentials provider, JWT session)
- S3-compatible object storage cho ảnh paste/nền — SeaweedFS ở dev, MinIO ở
  prod (xem phần "Deploy lên VPS" bên dưới vì sao khác nhau)

## Ports

App, Postgres và SeaweedFS **không** dùng cổng mặc định (3000, 5432,
9000-9001), vì máy chạy sẵn các service khác dùng đúng các cổng đó
(mathneo-backend:3000, mathneo-postgres:5432, mathneo-minio:9000-9001, …):

| Service          | Cổng (host) |
| ----------------- | ----------- |
| Next.js app        | 3300        |
| Postgres (dev/prod) | 5433        |
| SeaweedFS S3 gateway | 9010      |

Đổi lại trong `docker-compose.dev.yml` / `docker-compose.prod.yml` /
`.env` / `ecosystem.config.js` / `.claude/launch.json` nếu cần cổng khác.

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

   Mở [http://localhost:3300](http://localhost:3300).

5. Chạy test:

   ```bash
   npm run test
   ```

> Lưu ý: SeaweedFS (all-in-one single-node) mất khoảng 10-15 giây để bầu lại
> raft leader sau mỗi lần restart container — nếu upload/xem ảnh trả về lỗi
> ngay sau khi restart `object-storage`, đợi vài giây rồi thử lại.

> **Vì sao dev dùng SeaweedFS mà prod dùng MinIO:** máy dev (dùng để code/test
> phiên bản này) không pull được `minio/minio` từ Docker Hub (401/403 —
> MinIO đã khoá tải ảnh Docker miễn phí từ 2026, xem ledger Task 1), nên dev
> dùng SeaweedFS (cùng S3 API, pull được tự do). VPS thật của bạn đã có sẵn
> `minio/minio:latest` trong local image cache (đang chạy `mathneo-minio-1`),
> nên không cần pull lại — `docker-compose.prod.yml` dùng thẳng MinIO theo
> yêu cầu. App nói chuyện với cả hai qua cùng một S3 client
> (`lib/storage.ts`), không khác gì về code.

## Deploy lên VPS

Domain: `https://diary.lmt-nqt.online` qua **Cloudflare Tunnel** (không cần
Nginx — Cloudflare lo HTTPS/DNS, `cloudflared` chạy trên VPS nối thẳng vào
app và object storage qua `127.0.0.1`).

**Object storage trên VPS dùng MinIO, không phải SeaweedFS** (khác với dev —
xem lý do dưới). Dữ liệu lưu ở bind-mount, không phải Docker volume, theo
đúng layout thư mục VPS đã dùng:

- Postgres: `/srv/diary-together/postgres`
- MinIO: `/srv/nqt-math/minio`

Tạo 2 thư mục này trước khi `docker compose up` (ví dụ
`mkdir -p /srv/diary-together/postgres /srv/nqt-math/minio`).

1. Clone repo lên VPS, copy `.env.example` → `.env` và điền giá trị thật:
   - `NEXTAUTH_SECRET`: chuỗi ngẫu nhiên dài (`openssl rand -base64 32`).
   - `NEXTAUTH_URL`: `https://diary.lmt-nqt.online`.
   - `MINIO_ENDPOINT`: `http://127.0.0.1:9010` (nội bộ, app gọi S3 API).
   - `MINIO_PUBLIC_URL`: `https://media.lmt-nqt.online` (trình duyệt dùng để
     tải ảnh — xem `deploy/cloudflared-config.yml`).
   - `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY`: đặt giá trị thật, đây cũng
     chính là `MINIO_ROOT_USER`/`MINIO_ROOT_PASSWORD` của container MinIO
     (xem `docker-compose.prod.yml`) — đổi khỏi `minioadmin/minioadmin`.
   - `POSTGRES_PASSWORD` (dùng bởi `docker-compose.prod.yml`).

2. Bật Postgres + MinIO:

   ```bash
   mkdir -p /srv/diary-together/postgres /srv/nqt-math/minio
   docker compose -f docker-compose.prod.yml up -d
   ```

3. Cài dependency, chạy migration, build:

   ```bash
   npm install
   npx prisma migrate deploy
   npm run build
   ```

4. Chạy app bằng PM2 (cổng 3300, xem `ecosystem.config.js`):

   ```bash
   npm install -g pm2
   pm2 start ecosystem.config.js
   pm2 save
   ```

5. Cấu hình Cloudflare Tunnel: cài `cloudflared`, `cloudflared tunnel login`,
   `cloudflared tunnel create together-diary`, trỏ DNS cho cả
   `diary.lmt-nqt.online` và `media.lmt-nqt.online` về tunnel đó, rồi chạy
   `cloudflared tunnel --config deploy/cloudflared-config.yml run` (hoặc cài
   làm service: `cloudflared service install`). Chi tiết trong
   `deploy/cloudflared-config.yml`.

   (Nếu sau này đổi ý muốn dùng Nginx thay vì Cloudflare Tunnel,
   `deploy/nginx.conf` vẫn còn và làm đúng việc tương đương.)

6. Cấu hình bucket SeaweedFS đã có sẵn trong
   `deploy/seaweedfs-s3-config.json` (một identity có quyền Admin/Read/Write
   cho app, một identity `anonymous` chỉ có quyền `Read` để ảnh xem được công
   khai qua URL). Đổi `accessKey`/`secretKey` trước khi deploy thật và cập
   nhật `MINIO_ACCESS_KEY`/`MINIO_SECRET_KEY` trong `.env` cho khớp.
