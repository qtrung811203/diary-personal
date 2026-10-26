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

## Deploy lên VPS (toàn bộ bằng Docker)

**Hướng dẫn đầy đủ, từng bước, viết cho một AI agent tự chạy trên VPS:
[DEPLOY.md](DEPLOY.md).** Phần dưới đây chỉ là tóm tắt.

Cả 3 phần — app Next.js, Postgres, MinIO — chạy bằng Docker qua
`docker-compose.prod.yml` (xem [Dockerfile](Dockerfile) cho app). Domain:
qua **Cloudflare Tunnel** (không cần Nginx — xem
`deploy/cloudflared-config.yml`; `deploy/nginx.conf` vẫn còn làm phương án
dự phòng nếu muốn tự terminate TLS thay vì qua Cloudflare).

Dữ liệu Postgres/MinIO lưu ở bind-mount theo đúng layout thư mục VPS đã
dùng (`/srv/diary-together/postgres`, `/srv/nqt-math/minio`), không phải
Docker volume.

Tóm tắt lệnh (chi tiết + giải thích từng biến `.env` xem DEPLOY.md):

```bash
git clone https://github.com/qtrung811203/diary-personal.git
cd diary-personal
cp .env.example .env    # rồi điền NEXTAUTH_SECRET, NEXTAUTH_URL, MINIO_*, POSTGRES_PASSWORD

mkdir -p /srv/diary-together/postgres /srv/nqt-math/minio
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

# Cloudflare Tunnel — xem deploy/cloudflared-config.yml và DEPLOY.md Bước 5
cloudflared tunnel login
cloudflared tunnel create together-diary
cloudflared tunnel route dns together-diary diary.lmt-nqt.online
cloudflared tunnel route dns together-diary media.lmt-nqt.online
sudo cloudflared service install --config "$(pwd)/deploy/cloudflared-config.yml"
```

Cập nhật code sau này:

```bash
git pull origin main
docker compose -f docker-compose.prod.yml build app
docker compose -f docker-compose.prod.yml up -d app
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
```
