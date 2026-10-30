# Hướng dẫn deploy Together Diary lên VPS (dùng cho AI agent)

File này dành cho một Claude Code (hoặc agent tương tự) chạy trực tiếp trên
VPS để tự triển khai app. Đọc hết file này trước khi làm gì, đặc biệt phần
"Hỏi người dùng trước" — đừng tự bịa giá trị cho các biến đó.

## Bối cảnh

- App: Next.js (Together Diary), chạy trong Docker container cổng nội bộ
  `3300`.
- Đi kèm: PostgreSQL + MinIO (cũng chạy trong Docker, cùng
  `docker-compose.prod.yml`).
- Domain công khai: qua **Cloudflare Tunnel** (không dùng Nginx).
- VPS này đã chạy sẵn nhiều service khác (mathneo-\*, n8n, uptime-kuma, một
  Postgres và một MinIO khác) — mọi cổng/thư mục dữ liệu của dự án này đã
  được chọn để **không đụng** vào chúng. Đừng đổi cổng trừ khi người dùng
  yêu cầu, và trước khi chạy `docker compose up`, kiểm tra `docker ps` xem
  các cổng 3300/5433/9010/9011 có đang bị chiếm không.

## Việc cần làm, theo thứ tự

### Bước 1 — Hỏi người dùng trước (bắt buộc)

Trước khi tạo `.env`, hỏi người dùng các giá trị sau (đừng tự đoán hay để
giá trị mẫu/mặc định cho các mục đánh dấu **bắt buộc**):

| Biến | Bắt buộc? | Ghi chú |
| --- | --- | --- |
| `NEXTAUTH_SECRET` | Bắt buộc | Nếu người dùng không có sẵn, tự sinh bằng `openssl rand -base64 32` và báo lại giá trị đã dùng. |
| `NEXTAUTH_URL` | Bắt buộc | Domain công khai thật, có `https://` (ví dụ đã bàn: `https://diary.lmt-nqt.online`) — **hỏi lại để xác nhận domain cuối cùng**, đừng tự giả định vẫn là domain cũ nếu người dùng chưa xác nhận. |
| `MINIO_PUBLIC_URL` | Bắt buộc | Domain ảnh, dùng subdomain riêng (ví dụ `https://media.lmt-nqt.online`) — xem `deploy/cloudflared-config.yml`. |
| `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` | Bắt buộc | **Không dùng `minioadmin/minioadmin`** (giá trị mặc định trong code chỉ để dev local). Hỏi người dùng muốn tự đặt hay để bạn tự sinh ngẫu nhiên. |
| `MINIO_BUCKET` | Tuỳ chọn | Mặc định `together-diary`, hỏi nếu người dùng muốn tên khác. |
| `POSTGRES_PASSWORD` | Bắt buộc | Hỏi người dùng muốn tự đặt hay để bạn tự sinh ngẫu nhiên. |

Cách hỏi: liệt kê đúng bảng trên cho người dùng, hỏi từng giá trị một
(hoặc gộp lại một lần nếu họ muốn), chỉ tiếp tục Bước 2 khi đã có đủ giá
trị bắt buộc.

### Bước 2 — Kiểm tra môi trường

```bash
docker --version
docker compose version
cloudflared --version   # nếu chưa cài, xem Bước 5
```

Nếu thiếu Docker, dừng lại và báo người dùng — đừng tự ý cài Docker mà
không hỏi trước (đây là thay đổi hệ thống, không chỉ riêng dự án này).

### Bước 3 — Clone code và tạo `.env`

```bash
git clone https://github.com/qtrung811203/diary-personal.git
cd diary-personal
cp .env.example .env
```

Điền `.env` bằng các giá trị đã hỏi ở Bước 1. Các giá trị còn lại trong
`.env.example` (DATABASE_URL, PORT, MINIO_ENDPOINT) giữ nguyên như mẫu —
`docker-compose.prod.yml` tự ghi đè `DATABASE_URL`/`MINIO_ENDPOINT` bên
trong container bằng tên service nội bộ (`postgres`, `object-storage`),
không dùng giá trị `localhost` trong `.env`.

### Bước 4 — Tạo thư mục dữ liệu và chạy stack

```bash
mkdir -p /srv/diary-together/postgres /srv/nqt-math/minio
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

Chờ Postgres healthy rồi chạy migration (lần đầu deploy hoặc sau mỗi lần
đổi schema):

```bash
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
```

Kiểm tra:

```bash
docker compose -f docker-compose.prod.yml ps
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3300/login   # mong đợi 200
```

### Bước 5 — Cloudflare Tunnel

Nếu `cloudflared` chưa cài, cài theo hướng dẫn chính thức của Cloudflare
cho distro đang dùng (hỏi người dùng xác nhận trước khi cài gói hệ thống
mới nếu không chắc).

```bash
cloudflared tunnel login
cloudflared tunnel create together-diary
cloudflared tunnel route dns together-diary diary.lmt-nqt.online
cloudflared tunnel route dns together-diary media.lmt-nqt.online
```

(Hai domain phải khớp `NEXTAUTH_URL`/`MINIO_PUBLIC_URL` đã điền ở Bước 1.)

Sửa `deploy/cloudflared-config.yml`: điền `tunnel:` và `credentials-file:`
bằng ID/thư mục `cloudflared tunnel create` vừa in ra, đổi hostname nếu
người dùng dùng domain khác domain mặc định trong file.

Chạy nền bằng service (khuyến nghị, tự khởi động lại khi VPS reboot):

```bash
sudo cloudflared service install --config "$(pwd)/deploy/cloudflared-config.yml"
sudo systemctl enable --now cloudflared
```

### Bước 6 — Xác nhận lần cuối

Mở `https://<domain đã điền NEXTAUTH_URL>` trên trình duyệt, đăng ký một
tài khoản thử, viết một dòng nhật ký, paste một ảnh, đổi màu nền, mở lịch
— báo lại cho người dùng kết quả. Nếu có bước nào lỗi, đọc log trước khi
đoán nguyên nhân:

```bash
docker compose -f docker-compose.prod.yml logs app --tail 100
docker compose -f docker-compose.prod.yml logs postgres --tail 50
docker compose -f docker-compose.prod.yml logs object-storage --tail 50
```

## Cập nhật code sau này (deploy lại)

```bash
cd diary-personal
git pull origin main
docker compose -f docker-compose.prod.yml build app
docker compose -f docker-compose.prod.yml up -d app
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
```

Postgres/MinIO không cần rebuild trừ khi `docker-compose.prod.yml` đổi
version image của chúng.

## Test image Docker ở máy dev trước khi lên VPS (đã làm, kết quả PASS)

Không cần thêm service `app` vào `docker-compose.dev.yml` cho việc này —
dev hàng ngày vẫn dùng `npm run dev` (hot reload nhanh hơn container). Khi
cần kiểm tra bản build Docker thật trước khi deploy, build và chạy thủ
công, trỏ vào Postgres/SeaweedFS dev đã có sẵn qua `host.docker.internal`:

```bash
docker build -t together-diary:test .
docker run -d --name together-diary-test -p 3301:3300 \
  -e DATABASE_URL="postgresql://together_diary:together_diary@host.docker.internal:5433/together_diary?schema=public" \
  -e MINIO_ENDPOINT="http://host.docker.internal:9010" \
  -e MINIO_ACCESS_KEY="minioadmin" \
  -e MINIO_SECRET_KEY="minioadmin" \
  -e MINIO_BUCKET="together-diary" \
  -e NEXTAUTH_SECRET="docker-smoke-test-secret" \
  -e NEXTAUTH_URL="http://localhost:3301" \
  together-diary:test

curl http://localhost:3301/login                      # 200
docker exec together-diary-test npx prisma migrate deploy

docker rm -f together-diary-test && docker rmi together-diary:test
```

## Mã PIN và đăng nhập

- Mỗi tài khoản phải tạo mã PIN 6 số ở lần mở đầu tiên sau khi đăng nhập; tab mới luôn hỏi PIN, tự khoá sau 5 phút không thao tác.
- Sai PIN 5 lần thì khoá PIN 15 phút (vẫn đặt lại PIN được bằng mật khẩu). Quên mật khẩu thì dùng trang `/forgot-password` (email + PIN); đổi mật khẩu sẽ đăng xuất mọi thiết bị.
- Cần `NEXTAUTH_SECRET` cố định: token mở khoá được ký bằng khoá này. Migration `pin_lock` chạy qua `prisma migrate deploy` như các migration khác.

## Yêu thích và nhật ký ngày cũ

Migration `entry_favorite` thêm cột `isFavorite`; chạy qua `prisma migrate deploy` như các migration khác. Nhật ký ngày cũ tạo từ trang Tổng quan (bấm ô ngày trống trong quá khứ).

## Việc KHÔNG được tự ý làm

- Không đổi mật khẩu/secret của các service khác đã chạy sẵn trên VPS.
- Không `docker compose down -v` hay xoá volume/thư mục `/srv/*` mà không
  hỏi trước — đó là dữ liệu Postgres/MinIO thật.
- Không mở cổng Postgres/MinIO ra `0.0.0.0` — luôn giữ `127.0.0.1` như
  trong `docker-compose.prod.yml`, Cloudflare Tunnel là đường ra duy nhất.
- Không tự quyết định domain thay người dùng nếu họ chưa xác nhận.

## Tham khảo thêm

- [README.md](README.md) — tech stack, cổng, chạy dev, tổng quan deploy.
- [docker-compose.prod.yml](docker-compose.prod.yml) — định nghĩa 3 service.
- [Dockerfile](Dockerfile) — build app.
- [deploy/cloudflared-config.yml](deploy/cloudflared-config.yml) — ingress rules.
- [.env.example](.env.example) — toàn bộ biến môi trường và ý nghĩa từng biến.
