import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { isValidPin } from "@/lib/pin";
import { checkPin, unlockTokenFor } from "@/lib/pin-store";

export async function POST(request: Request) {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  if (!isValidPin(body?.pin)) {
    return NextResponse.json({ error: "PIN phải gồm đúng 6 chữ số." }, { status: 400 });
  }

  const result = await checkPin(guard.userId, body.pin);
  switch (result.status) {
    case "ok":
      return NextResponse.json({ token: unlockTokenFor(guard.userId, guard.sessionVersion!) });
    case "no-pin":
      return NextResponse.json({ error: "Chưa có mã PIN." }, { status: 409 });
    case "locked":
      return NextResponse.json({ error: "locked-out", lockedUntil: result.lockedUntil }, { status: 429 });
    case "wrong":
      return NextResponse.json(
        { error: "wrong", remaining: result.remaining, lockedUntil: result.lockedUntil },
        { status: result.lockedUntil ? 429 : 401 }
      );
  }
}
