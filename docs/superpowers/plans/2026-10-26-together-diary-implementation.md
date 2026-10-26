# Together Diary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the real Next.js diary web app whose layout was approved in `mockups/*.html`: per-user login, one rich-text entry per calendar day with a per-day page background, image paste-to-upload, and a month calendar showing written vs unwritten days.

**Architecture:** Single Next.js (App Router, TypeScript) app serving both the UI and the API routes, deployed on one VPS via PM2 + Nginx. PostgreSQL (via Prisma) holds users and diary entries; MinIO (S3-compatible, self-hosted) holds pasted/background images. NextAuth (Credentials provider) handles auth with a JWT session. TipTap (ProseMirror) powers the rich-text editor.

**Tech Stack:** Next.js 14 (App Router, TypeScript), Tailwind CSS, Prisma + PostgreSQL, NextAuth.js (Credentials + JWT), TipTap, MinIO (`@aws-sdk/client-s3`), bcrypt, Vitest (unit tests for pure logic), Docker Compose (local Postgres+MinIO and prod), PM2 + Nginx (deploy).

**Spec:** `C:\Users\trungNQT\.claude\plans\planning-cho-t-i-m-t-iterative-allen.md` (approved plan) and the approved mockups in `mockups/login.html`, `mockups/today.html`, `mockups/calendar.html`, `mockups/past-day.html`, `mockups/today-mobile.html`.

## Global Constraints

- One diary entry per user per calendar date; opening a past date edits that same entry (never creates a second one), never locked.
- Rich text toolbar: Bold, Italic, Underline, uppercase/lowercase text-transform, align left/center/right (from mockups' toolbar).
- Background (color or image) is per day, applied to the whole page, not just the editor box.
- Image paste (Ctrl+V) uploads to MinIO and inserts the resulting URL into the entry content.
- Auth via NextAuth Credentials provider, JWT session strategy, bcrypt-hashed passwords.
- Deployment target is a single self-hosted VPS: PM2 for the Next.js process, Nginx reverse proxy, Postgres + MinIO via docker-compose.
- Responsive down to mobile widths per `mockups/today-mobile.html` (collapsed toolbar, bottom-sheet calendar).

## Review Focus

- Registering with an email that already exists must return a clear error and must not create a duplicate `User` row.
- Logging in with a wrong password must not create a session and must show an error, not a silent redirect.
- Requesting/saving a diary entry for a malformed or out-of-range date string (e.g. `2026-13-40`, `not-a-date`) must be rejected with 400, not crash or silently create a bad row.
- Pasting plain text (not an image) into the editor must insert normal text and must never trigger an image upload call.
- Calling the upload or diary-save API without a valid session must return 401 and must not write any file or DB row.

---

## Task 1: Project Scaffold & Tooling

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, `postcss.config.js`, `.eslintrc.json`
- Create: `app/layout.tsx`, `app/globals.css`, `app/page.tsx` (temporary placeholder)
- Create: `.env.example`, `.gitignore`
- Create: `docker-compose.dev.yml` (Postgres + MinIO for local dev)

**Interfaces:**
- Produces: a runnable `npm run dev` Next.js app on port 3000, Tailwind working, `.env` keys later tasks read (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`).

- [ ] **Step 1: Scaffold with `create-next-app`**

Run: `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias "@/*"`

- [ ] **Step 2: Add `docker-compose.dev.yml`** with services `postgres` (image `postgres:16`, db `together_diary`) and `minio` (image `minio/minio`, console port 9001, api port 9000).

- [ ] **Step 3: Add `.env.example`** listing `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET` with placeholder values matching the dev compose file.

- [ ] **Step 4: Add Vitest** for unit tests on pure logic: `npm install -D vitest`, add `"test": "vitest run"` script, create `vitest.config.ts`.

- [ ] **Step 5: Verify dev server runs**

Run: `docker compose -f docker-compose.dev.yml up -d && npm run dev`
Expected: Postgres/MinIO containers healthy; `http://localhost:3000` renders the default Next.js page with no console errors.

- [ ] **Step 6: Commit**

```bash
git init
git add -A
git commit -m "chore: scaffold Next.js app with Tailwind, Vitest, dev docker-compose"
```

---

## Task 2: Database Schema (Prisma)

**Files:**
- Create: `prisma/schema.prisma`
- Create: `lib/prisma.ts`
- Test: `lib/validation.test.ts`
- Create: `lib/validation.ts`

**Interfaces:**
- Consumes: `DATABASE_URL` from `.env` (Task 1).
- Produces: `prisma.user`, `prisma.diaryEntry` Prisma Client models; `lib/prisma.ts` exports a singleton `prisma: PrismaClient`; `lib/validation.ts` exports `isValidDateParam(value: string): boolean` (true only for a real calendar date in `YYYY-MM-DD` form, no out-of-range month/day) — used by Task 5's API routes.

- [ ] **Step 1: Write `prisma/schema.prisma`**

Models:
```prisma
model User {
  id           String        @id @default(cuid())
  email        String        @unique
  passwordHash String
  name         String?
  createdAt    DateTime      @default(now())
  entries      DiaryEntry[]
}

model DiaryEntry {
  id               String   @id @default(cuid())
  userId           String
  date             String   // "YYYY-MM-DD"
  contentJson      Json
  backgroundType   String   @default("color") // "color" | "image"
  backgroundValue  String   @default("#fbe9d6")
  updatedAt        DateTime @updatedAt
  user             User     @relation(fields: [userId], references: [id])

  @@unique([userId, date])
}
```

- [ ] **Step 2: Write the failing test for `isValidDateParam`**

```ts
import { describe, it, expect } from 'vitest';
import { isValidDateParam } from './validation';

describe('isValidDateParam', () => {
  it('accepts a real calendar date', () => expect(isValidDateParam('2026-10-26')).toBe(true));
  it('rejects an out-of-range month', () => expect(isValidDateParam('2026-13-01')).toBe(false));
  it('rejects an out-of-range day', () => expect(isValidDateParam('2026-02-30')).toBe(false));
  it('rejects a non-date string', () => expect(isValidDateParam('not-a-date')).toBe(false));
  it('rejects wrong format', () => expect(isValidDateParam('26-10-2026')).toBe(false));
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test -- lib/validation.test.ts`
Expected: FAIL with "isValidDateParam is not a function" / module not found.

- [ ] **Step 4: Implement `isValidDateParam(value: string): boolean` in `lib/validation.ts`**

Regex-match `YYYY-MM-DD` first, then round-trip through `Date` and compare `getFullYear`/`getMonth`/`getDate` back against the input to reject dates like `2026-02-30` that `Date` silently rolls over.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- lib/validation.test.ts`
Expected: PASS (5/5).

- [ ] **Step 6: Write `lib/prisma.ts`** exporting a singleton `PrismaClient` (guarded with `globalThis` cache for dev hot-reload).

- [ ] **Step 7: Run migration**

Run: `npx prisma migrate dev --name init`
Expected: migration applies cleanly against the dev Postgres container; `User` and `DiaryEntry` tables exist.

- [ ] **Step 8: Commit**

```bash
git add prisma lib/prisma.ts lib/validation.ts lib/validation.test.ts
git commit -m "feat: add Prisma schema for User/DiaryEntry and date validation helper"
```

---

## Task 3: Auth (Register + NextAuth Credentials)

**Files:**
- Create: `lib/auth-helpers.ts`
- Test: `lib/auth-helpers.test.ts`
- Create: `lib/auth.ts` (NextAuth config)
- Create: `app/api/auth/[...nextauth]/route.ts`
- Create: `app/api/auth/register/route.ts`
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/register/page.tsx`
- Create: `app/(auth)/layout.tsx`

**Interfaces:**
- Consumes: `prisma` (Task 2), `NEXTAUTH_SECRET` from env.
- Produces: `lib/auth-helpers.ts` exports `hashPassword(plain: string): Promise<string>` and `verifyPassword(plain: string, hash: string): Promise<boolean>`; `lib/auth.ts` exports `authOptions: NextAuthOptions` (JWT strategy, Credentials provider) consumed by Task 4's middleware and by `/api/auth/[...nextauth]`.

- [ ] **Step 1: Write the failing test for password helpers**

```ts
import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './auth-helpers';

describe('auth-helpers', () => {
  it('verifies a correct password against its hash', async () => {
    const hash = await hashPassword('correct-horse');
    expect(await verifyPassword('correct-horse', hash)).toBe(true);
  });
  it('rejects a wrong password', async () => {
    const hash = await hashPassword('correct-horse');
    expect(await verifyPassword('wrong-password', hash)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- lib/auth-helpers.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `hashPassword`/`verifyPassword` in `lib/auth-helpers.ts`** using `bcrypt` (`bcrypt.hash(plain, 10)` / `bcrypt.compare`).

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- lib/auth-helpers.test.ts`
Expected: PASS (2/2).

- [ ] **Step 5: Implement `app/api/auth/register/route.ts`** — `POST` body `{ email, password, name? }`: 400 if `isValidEmail`/password-too-short fails (basic check), 409 if `prisma.user.findUnique({ where: { email } })` already exists, else `prisma.user.create` with `hashPassword(password)`, return 201.

- [ ] **Step 6: Implement `lib/auth.ts`** — `authOptions` with `CredentialsProvider` whose `authorize(credentials)` looks up the user by email, calls `verifyPassword`, returns `{ id, email, name }` or `null`; `session: { strategy: 'jwt' }`; `secret: process.env.NEXTAUTH_SECRET`.

- [ ] **Step 7: Implement `app/api/auth/[...nextauth]/route.ts`** exporting `GET`/`POST` from `NextAuth(authOptions)`.

- [ ] **Step 8: Build `app/(auth)/login/page.tsx` and `app/(auth)/register/page.tsx`** as client components matching `mockups/login.html` (tabs, same field layout), calling `signIn('credentials', {...})` and `POST /api/auth/register` respectively; on success redirect to `/diary` (Task 4's default route).

- [ ] **Step 9: Manual verification**

Run: `npm run dev`, open `http://localhost:3000/register`, register a new account, confirm redirect to `/diary` works after login; try registering the same email twice and confirm a visible error, not a crash; try logging in with a wrong password and confirm a visible error and no redirect.

- [ ] **Step 10: Commit**

```bash
git add lib/auth-helpers.ts lib/auth-helpers.test.ts lib/auth.ts app/api/auth app/\(auth\)
git commit -m "feat: add registration and NextAuth credentials login"
```

---

## Task 4: Protected Layout & Default Route

**Files:**
- Create: `middleware.ts`
- Create: `app/(app)/layout.tsx`
- Modify: `app/page.tsx` (redirect `/` → `/diary` or `/login`)

**Interfaces:**
- Consumes: `authOptions` (Task 3) via `getServerSession`/NextAuth JWT middleware matcher.
- Produces: every route under `app/(app)/**` (Task 5's diary pages) is only reachable with a valid session; unauthenticated requests redirect to `/login`.

- [ ] **Step 1: Implement `middleware.ts`** using `withAuth` from `next-auth/middleware` with `matcher: ['/diary/:path*']`, redirecting unauthenticated requests to `/login`.

- [ ] **Step 2: Implement `app/(app)/layout.tsx`** — server component that calls `getServerSession(authOptions)`; if no session, `redirect('/login')` (defense in depth alongside the middleware); otherwise renders `children`.

- [ ] **Step 3: Implement `app/page.tsx`** — server component: if session exists, `redirect('/diary')`; else `redirect('/login')`.

- [ ] **Step 4: Manual verification**

Run: `npm run dev`, visit `http://localhost:3000/diary` while logged out → redirected to `/login`; log in → visiting `/` redirects to `/diary`.

- [ ] **Step 5: Commit**

```bash
git add middleware.ts app/\(app\)/layout.tsx app/page.tsx
git commit -m "feat: protect /diary routes and add default-route redirect"
```

---

## Task 5: Diary API Routes

**Files:**
- Create: `app/api/diary/[date]/route.ts`
- Create: `app/api/diary/month/[yyyymm]/route.ts`
- Test: `lib/validation.test.ts` (extend with month-param cases)
- Modify: `lib/validation.ts` (add `isValidMonthParam`)

**Interfaces:**
- Consumes: `prisma` (Task 2), `isValidDateParam` (Task 2), `getServerSession`/`authOptions` (Task 3).
- Produces: `GET /api/diary/:date` → `{ contentJson, backgroundType, backgroundValue } | null`; `PUT /api/diary/:date` body `{ contentJson, backgroundType, backgroundValue }` → upserts the caller's entry for that date; `GET /api/diary/month/:yyyymm` → `{ writtenDates: string[] }` (dates in that month that have an entry for the caller). All three require a session (401 otherwise) and scope strictly to `session.user.id`.

- [ ] **Step 1: Write the failing test for `isValidMonthParam`**

```ts
it('accepts YYYY-MM', () => expect(isValidMonthParam('2026-10')).toBe(true));
it('rejects an invalid month number', () => expect(isValidMonthParam('2026-13')).toBe(false));
it('rejects wrong format', () => expect(isValidMonthParam('2026/10')).toBe(false));
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- lib/validation.test.ts`
Expected: FAIL, `isValidMonthParam` not exported.

- [ ] **Step 3: Implement `isValidMonthParam(value: string): boolean` in `lib/validation.ts`** (regex `^\d{4}-(0[1-9]|1[0-2])$`).

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- lib/validation.test.ts`
Expected: PASS (all cases, including the 3 new ones).

- [ ] **Step 5: Implement `GET`/`PUT` in `app/api/diary/[date]/route.ts`** — read session via `getServerSession(authOptions)` (401 if absent); 400 via `isValidDateParam(params.date)`; `GET` does `prisma.diaryEntry.findUnique({ where: { userId_date: { userId, date } } })`; `PUT` does `prisma.diaryEntry.upsert` keyed on the same compound unique, scoped to `session.user.id` (never trust a userId from the body).

- [ ] **Step 6: Implement `GET` in `app/api/diary/month/[yyyymm]/route.ts`** — 401 if no session, 400 via `isValidMonthParam`; `prisma.diaryEntry.findMany({ where: { userId, date: { startsWith: yyyymm } }, select: { date: true } })`, return `{ writtenDates: [...] }`.

- [ ] **Step 7: Manual verification**

Run: `npm run dev`, with a logged-in session cookie: `curl -X PUT http://localhost:3000/api/diary/2026-10-26 -H "Content-Type: application/json" -d '{"contentJson":{"type":"doc"},"backgroundType":"color","backgroundValue":"#fbe9d6"}' --cookie "<session-cookie>"` → 200; then `curl http://localhost:3000/api/diary/2026-10-26 --cookie "<session-cookie>"` returns the saved entry. `curl http://localhost:3000/api/diary/not-a-date --cookie "<session-cookie>"` → 400. `curl http://localhost:3000/api/diary/2026-10-26` (no cookie) → 401.

- [ ] **Step 8: Commit**

```bash
git add app/api/diary lib/validation.ts lib/validation.test.ts
git commit -m "feat: add diary entry and month-summary API routes"
```

---

## Task 6: Diary Editor (TipTap) + Today/Past-Day Pages

**Files:**
- Create: `components/DiaryEditor.tsx`
- Create: `components/EditorToolbar.tsx`
- Create: `lib/tiptap-text-case.ts` (custom TipTap mark extension)
- Create: `app/(app)/diary/[date]/page.tsx`
- Create: `app/(app)/diary/page.tsx` (redirects to today's `YYYY-MM-DD`)
- Create: `hooks/useDebouncedCallback.ts`

**Interfaces:**
- Consumes: `GET`/`PUT /api/diary/[date]` (Task 5).
- Produces: `DiaryEditor` props `{ initialContent: JSONContent, onChange: (json: JSONContent) => void }`; renders the TipTap editor + `EditorToolbar` matching `mockups/today.html`/`mockups/past-day.html` (Bold/Italic/Underline, uppercase/lowercase via the custom `textCase` mark, align left/center/right via TipTap's built-in `TextAlign` extension). Reused by both `app/(app)/diary/[date]/page.tsx` (today = `date === todayStr`, shows the today topbar) and the same route for past dates (shows the "editing a past day" banner + prev/next date nav from `mockups/past-day.html`), per the plan's one-route-for-both decision.

- [ ] **Step 1: Implement `lib/tiptap-text-case.ts`** — a TipTap `Mark` extension `textCase` with attribute `case: 'upper' | 'lower'`, rendered as inline `style="text-transform: uppercase|lowercase"` (visual only, does not mutate stored text), with toggle commands `toggleUpperCase`/`toggleLowerCase`.

- [ ] **Step 2: Implement `hooks/useDebouncedCallback.ts`** — `useDebouncedCallback<T extends (...args: any[]) => void>(fn: T, delayMs: number): T`.

- [ ] **Step 3: Implement `components/EditorToolbar.tsx`** — buttons wired to `editor.chain().focus().toggleBold()/toggleItalic()/toggleUnderline()/toggleUpperCase()/toggleLowerCase()/setTextAlign('left'|'center'|'right').run()`, active state from `editor.isActive(...)`, same icon set as `mockups/today.html`'s `.toolbar`.

- [ ] **Step 4: Implement `components/DiaryEditor.tsx`** — `useEditor` with `StarterKit`, `Underline`, `TextAlign.configure({ types: ['paragraph'] })`, the `textCase` mark, and `Image`; calls `onChange(editor.getJSON())` debounced 800ms via `useDebouncedCallback`.

- [ ] **Step 5: Implement `app/(app)/diary/[date]/page.tsx`** — client component: on mount `GET /api/diary/:date`; render topbar/date-nav/background per the `today.html`/`past-day.html` mockups depending on whether `params.date === todayStr`; `DiaryEditor` with `onChange` calling `PUT /api/diary/:date` with the latest `contentJson` (background fields come from Task 8).

- [ ] **Step 6: Implement `app/(app)/diary/page.tsx`** — server component redirecting to `/diary/<today's YYYY-MM-DD in server's local date>`.

- [ ] **Step 7: Manual verification**

Run: `npm run dev`, log in, confirm landing on `/diary/<today>` with the editor matching `mockups/today.html`; type text, toggle Bold/Italic/Underline/uppercase/center-align, reload the page and confirm the formatting persisted; navigate to `/diary/2026-10-20` directly and confirm the "past day" banner/nav shows per `mockups/past-day.html`, and that edits there also persist.

- [ ] **Step 8: Commit**

```bash
git add components/DiaryEditor.tsx components/EditorToolbar.tsx lib/tiptap-text-case.ts app/\(app\)/diary hooks
git commit -m "feat: add TipTap diary editor with formatting toolbar and autosave"
```

---

## Task 7: Image Paste Upload (MinIO)

**Files:**
- Create: `lib/storage.ts`
- Create: `app/api/upload/route.ts`
- Modify: `components/DiaryEditor.tsx` (paste handler)

**Interfaces:**
- Consumes: `MINIO_*` env vars (Task 1), `getServerSession`/`authOptions` (Task 3).
- Produces: `lib/storage.ts` exports `uploadImage(buffer: Buffer, contentType: string): Promise<string>` (returns a public URL); `POST /api/upload` accepts `multipart/form-data` field `file`, returns `{ url: string }`, used both by the editor's paste handler and by Task 8's background-image upload.

- [ ] **Step 1: Implement `lib/storage.ts`** — S3 client (`@aws-sdk/client-s3`) configured from `MINIO_ENDPOINT`/`MINIO_ACCESS_KEY`/`MINIO_SECRET_KEY`; `uploadImage` generates a random key (`crypto.randomUUID()` + extension from `contentType`), `PutObjectCommand` to `MINIO_BUCKET`, returns `${MINIO_ENDPOINT}/${MINIO_BUCKET}/${key}`.

- [ ] **Step 2: Implement `app/api/upload/route.ts`** — `POST`: 401 if no session; read `file` from `await request.formData()`; 400 if missing or `!file.type.startsWith('image/')`; 413 if `file.size > 5 * 1024 * 1024`; else `uploadImage(Buffer.from(await file.arrayBuffer()), file.type)`, return `{ url }`.

- [ ] **Step 3: Wire the editor's paste handler in `components/DiaryEditor.tsx`** — `editorProps.handlePaste(view, event)`: inspect `event.clipboardData.items`; if an item's `type.startsWith('image/')`, `event.preventDefault()`, build a `FormData`, `POST /api/upload`, then on success `editor.chain().focus().setImage({ src: url }).run()`; if no image item is present, return `false` so TipTap's default paste handling (plain text) proceeds untouched.

- [ ] **Step 4: Manual verification**

Run: `npm run dev`, copy an image (e.g. a screenshot) to the clipboard, paste into the editor on `/diary/<today>`, confirm it uploads and renders inline, and that the image persists after reload. Copy plain text and paste, confirm it inserts as text with no network call to `/api/upload` (check the Network tab). Call `curl -X POST http://localhost:3000/api/upload -F "file=@image.png"` with no cookie → 401.

- [ ] **Step 5: Commit**

```bash
git add lib/storage.ts app/api/upload components/DiaryEditor.tsx
git commit -m "feat: upload pasted images to MinIO from the diary editor"
```

---

## Task 8: Background Picker (Color / Image)

**Files:**
- Create: `components/BackgroundPicker.tsx`
- Modify: `app/(app)/diary/[date]/page.tsx` (wire background state, apply page background, persist via existing `PUT /api/diary/:date`)

**Interfaces:**
- Consumes: `POST /api/upload` (Task 7, reused for background images), `PUT /api/diary/:date` (Task 5, now also sends `backgroundType`/`backgroundValue`).
- Produces: `BackgroundPicker` props `{ backgroundType: 'color' | 'image', backgroundValue: string, onChange: (type, value) => void }`, matching the swatch/upload popover in `mockups/today.html`'s `.bg-pop`.

- [ ] **Step 1: Implement `components/BackgroundPicker.tsx`** — popover with the same 6 swatches as `mockups/today.html` plus an "upload ảnh nền" button; swatch click calls `onChange('color', hex)`; upload button opens a file picker, `POST`s to `/api/upload`, then calls `onChange('image', url)`.

- [ ] **Step 2: Wire it into `app/(app)/diary/[date]/page.tsx`** — page-level container's `style` sets `background` from `backgroundType === 'image' ? \`url(${backgroundValue}) center/cover\` : backgroundValue`; `onChange` from `BackgroundPicker` updates local state and triggers the same debounced `PUT /api/diary/:date` save used for content.

- [ ] **Step 3: Manual verification**

Run: `npm run dev`, open a day, change background to a swatch color, confirm the whole page background changes immediately; reload and confirm it persisted; upload a background image and confirm the same.

- [ ] **Step 4: Commit**

```bash
git add components/BackgroundPicker.tsx app/\(app\)/diary
git commit -m "feat: add per-day background picker wired to persisted background fields"
```

---

## Task 9: Calendar, Responsive Pass, and Deployment Config

**Files:**
- Create: `components/Calendar.tsx`
- Modify: `app/(app)/diary/[date]/page.tsx` (open Calendar from the 📅 button, navigate on date click)
- Modify: `app/globals.css` / Tailwind breakpoints (collapsed toolbar + bottom-sheet calendar on mobile, per `mockups/today-mobile.html`)
- Create: `docker-compose.prod.yml`, `ecosystem.config.js` (PM2), `deploy/nginx.conf`
- Create: `README.md` (dev + deploy instructions)

**Interfaces:**
- Consumes: `GET /api/diary/month/:yyyymm` (Task 5).
- Produces: `Calendar` props `{ year: number, month: number, writtenDates: string[], selectedDate: string, onSelectDate: (date: string) => void, onClose: () => void }`, rendered as the centered modal on desktop (`mockups/calendar.html`) and the bottom sheet on mobile widths (`mockups/today-mobile.html`'s `.sheet`).

- [ ] **Step 1: Implement `components/Calendar.tsx`** — month grid (leading/trailing muted days from adjacent months like the mockup), dot marker when a cell's date is in `writtenDates`, `today` cell styling, prev/next month nav (refetches `GET /api/diary/month/:yyyymm` for the new month), `onSelectDate(date)` on cell click.

- [ ] **Step 2: Wire `Calendar` into `app/(app)/diary/[date]/page.tsx`** — 📅 button toggles it open; `onSelectDate` calls `router.push(\`/diary/${date}\`)`; render as a centered scrim-modal ≥640px and a bottom-sheet below 640px (match the two mockups' breakpoint).

- [ ] **Step 3: Responsive pass** — apply the same `@media (max-width: 640px)` adjustments already present in `mockups/today.html`/`mockups/past-day.html`/`mockups/today-mobile.html` (toolbar overflow-x scroll or collapse-to-"⋯", reduced padding/font sizes) to `EditorToolbar`/`DiaryEditor`/the diary page.

- [ ] **Step 4: Manual verification (desktop + mobile)**

Run: `npm run dev`, resize the browser to a mobile width and confirm the toolbar and calendar match `mockups/today-mobile.html`'s collapsed/bottom-sheet behavior; at desktop width confirm the calendar matches `mockups/calendar.html`; click a past date in the calendar and confirm navigation to that day's editor.

- [ ] **Step 5: Write deployment config** — `docker-compose.prod.yml` (Postgres + MinIO, named volumes, no host-exposed dev ports beyond what Nginx needs), `ecosystem.config.js` (PM2 app running `npm run start`), `deploy/nginx.conf` (reverse proxy to the PM2 port, `client_max_body_size 5m` to match the 5MB upload limit from Task 7).

- [ ] **Step 6: Write `README.md`** covering: local dev setup (`docker compose -f docker-compose.dev.yml up -d`, `npx prisma migrate dev`, `npm run dev`), and VPS deploy steps (clone, `.env` from `.env.example`, `docker compose -f docker-compose.prod.yml up -d`, `npx prisma migrate deploy`, `npm run build`, `pm2 start ecosystem.config.js`, point Nginx at `deploy/nginx.conf`, `certbot` for HTTPS).

- [ ] **Step 7: Full end-to-end manual verification**

Run: `npm run build && npm run start`, repeat the flow from the original plan's Verification section against the production build: register → login → land on today → format text + paste image → change background → open calendar → jump to a past day → edit it → reopen calendar and confirm that day now shows the written-day dot.

- [ ] **Step 8: Commit**

```bash
git add components/Calendar.tsx app/\(app\)/diary app/globals.css docker-compose.prod.yml ecosystem.config.js deploy README.md
git commit -m "feat: add calendar navigation, mobile responsive pass, and deployment config"
```
