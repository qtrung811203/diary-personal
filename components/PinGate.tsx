"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getUnlockToken, LOCK_EVENT, setUnlockToken } from "@/lib/api-client";
import { useIdleLock } from "@/hooks/useIdleLock";
import PinInput from "./PinInput";

const IDLE_MS = 5 * 60 * 1000;

type Phase = "loading" | "setup" | "enter" | "forgot" | "unlocked";

function untilLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false });
}

// Nothing inside renders (so nothing is fetched) until this tab has entered
// the PIN. The token lives in sessionStorage: a new tab starts locked, F5 in
// the same tab does not. The server enforces it too (423 without a token).
export default function PinGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/pin/status")
      .then(async (res) => {
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        setLockedUntil(data.lockedUntil ?? null);
        if (!data.hasPin) setPhase("setup");
        else setPhase(getUnlockToken() ? "unlocked" : "enter");
      })
      .catch(() => !cancelled && setPhase("enter"));
    return () => {
      cancelled = true;
    };
  }, [router]);

  const lock = useCallback(() => setPhase((p) => (p === "unlocked" ? "enter" : p)), []);

  useEffect(() => {
    window.addEventListener(LOCK_EVENT, lock);
    return () => window.removeEventListener(LOCK_EVENT, lock);
  }, [lock]);

  // The diary has unmounted (and flushed its last save) by the time this runs.
  useEffect(() => {
    if (phase === "enter" || phase === "setup") setUnlockToken(null);
  }, [phase]);

  useIdleLock(lock, IDLE_MS, phase === "unlocked");

  function unlocked(token: string) {
    setUnlockToken(token);
    setLockedUntil(null);
    setPhase("unlocked");
  }

  if (phase === "unlocked") return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#fff2d9]">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-20 w-[420px] h-[420px] rounded-full bg-[#ffd1de] blur-3xl opacity-90" />
        <div className="absolute top-1/3 -right-24 w-[380px] h-[380px] rounded-full bg-[#fadfae] blur-3xl opacity-80" />
        <div className="absolute -bottom-28 left-1/4 w-[420px] h-[420px] rounded-full bg-[#fbe1da] blur-3xl opacity-90" />
      </div>
      <div className="relative min-h-full flex items-center justify-center p-4">
        <div className="w-full max-w-[400px] rounded-[28px] border border-white/70 bg-white/55 backdrop-blur-xl shadow-xl px-6 sm:px-8 py-9 text-[#3a332c]">
          {phase === "loading" && <p className="text-center text-sm text-[#7a6f62]">Đang tải…</p>}
          {phase === "setup" && <SetupPin onDone={unlocked} />}
          {phase === "enter" && (
            <EnterPin lockedUntil={lockedUntil} onLockedUntil={setLockedUntil} onDone={unlocked} onForgot={() => setPhase("forgot")} />
          )}
          {phase === "forgot" && <ForgotPin onDone={unlocked} onBack={() => setPhase("enter")} />}
        </div>
      </div>
    </div>
  );
}

function Header({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="text-center mb-6">
      <div className="text-3xl mb-1">🔒</div>
      <h1 className="text-lg font-bold font-[family-name:var(--font-lora)]">{title}</h1>
      <p className="text-sm text-[#7a6f62] mt-1 leading-snug">{hint}</p>
    </div>
  );
}

function SetupPin({ onDone }: { onDone: (token: string) => void }) {
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [step, setStep] = useState<"first" | "again">("first");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(second: string) {
    if (second !== pin) {
      setError("Hai mã PIN không giống nhau. Thử lại.");
      setPin("");
      setConfirm("");
      setStep("first");
      return;
    }
    setBusy(true);
    const res = await apiFetch("/api/pin/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    }).catch(() => null);
    setBusy(false);
    if (!res?.ok) {
      setError("Không tạo được PIN, thử lại nhé.");
      setConfirm("");
      return;
    }
    onDone((await res.json()).token);
  }

  return (
    <>
      <Header
        title={step === "first" ? "Tạo mã PIN" : "Nhập lại mã PIN"}
        hint={
          step === "first"
            ? "Mã PIN 6 số sẽ được hỏi mỗi khi bạn mở nhật ký trên một tab mới."
            : "Nhập lại mã PIN vừa tạo để xác nhận."
        }
      />
      {step === "first" ? (
        <PinInput
          key="first"
          label="Mã PIN mới"
          value={pin}
          autoFocus
          onChange={(v) => {
            setError(null);
            setPin(v);
            if (v.length === 6) setStep("again");
          }}
        />
      ) : (
        <PinInput
          key="again"
          label="Nhập lại mã PIN"
          value={confirm}
          autoFocus
          disabled={busy}
          onChange={(v) => {
            setConfirm(v);
            if (v.length === 6) void submit(v);
          }}
        />
      )}
      {error && <p className="text-sm text-red-600 text-center mt-4">{error}</p>}
    </>
  );
}

function EnterPin({
  lockedUntil,
  onLockedUntil,
  onDone,
  onForgot,
}: {
  lockedUntil: string | null;
  onLockedUntil: (v: string | null) => void;
  onDone: (token: string) => void;
  onForgot: () => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [now] = useState(() => Date.now());
  const locked = !!lockedUntil && new Date(lockedUntil).getTime() > now;

  async function submit(value: string) {
    setBusy(true);
    const res = await apiFetch("/api/pin/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: value }),
    }).catch(() => null);
    setBusy(false);
    setPin("");
    if (!res) return setError("Không kết nối được máy chủ.");
    const data = await res.json().catch(() => ({}));
    if (res.ok) return onDone(data.token);
    if (res.status === 401 && data.error === "wrong") {
      return setError(`Sai mã PIN. Còn ${data.remaining} lần thử.`);
    }
    if (res.status === 429) {
      onLockedUntil(data.lockedUntil);
      return setError(null);
    }
    setError("Có lỗi xảy ra, thử lại nhé.");
  }

  return (
    <>
      <Header title="Nhập mã PIN" hint="Nhập mã PIN 6 số để mở nhật ký của bạn." />
      <PinInput
        label="Mã PIN"
        value={pin}
        autoFocus
        invalid={!!error}
        disabled={busy || locked}
        onChange={(v) => {
          setError(null);
          setPin(v);
          if (v.length === 6) void submit(v);
        }}
      />
      {locked && (
        <p className="text-sm text-red-600 text-center mt-4 leading-snug">
          Nhập sai quá 5 lần. Thử lại sau {untilLabel(lockedUntil!)}, hoặc dùng mật khẩu để đặt PIN mới.
        </p>
      )}
      {error && <p className="text-sm text-red-600 text-center mt-4">{error}</p>}
      <button type="button" onClick={onForgot} className="block mx-auto mt-6 text-sm font-semibold text-[#e8829e] hover:text-[#d96b89]">
        Quên PIN? Dùng mật khẩu
      </button>
    </>
  );
}

function ForgotPin({ onDone, onBack }: { onDone: (token: string) => void; onBack: () => void }) {
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pin.length !== 6) return setError("PIN mới phải gồm đúng 6 chữ số.");
    setBusy(true);
    setError(null);
    const res = await apiFetch("/api/pin/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, newPin: pin }),
    }).catch(() => null);
    setBusy(false);
    if (!res) return setError("Không kết nối được máy chủ.");
    const data = await res.json().catch(() => ({}));
    if (res.ok) return onDone(data.token);
    setError(data.error ?? "Có lỗi xảy ra, thử lại nhé.");
  }

  return (
    <>
      <Header title="Đặt lại mã PIN" hint="Nhập mật khẩu tài khoản và chọn mã PIN mới." />
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label className="text-[12.5px] font-semibold text-[#7a6f62]">Mật khẩu</label>
          <input
            type="password"
            required
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full border border-[#e7ddd0] bg-white/80 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#e8829e]"
          />
        </div>
        <div>
          <label className="text-[12.5px] font-semibold text-[#7a6f62] block mb-1.5">PIN mới (6 số)</label>
          <PinInput label="PIN mới" value={pin} onChange={setPin} />
        </div>
        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="bg-[#e8829e] hover:bg-[#d96b89] text-white rounded-lg py-3 text-[14.5px] font-semibold disabled:opacity-60"
        >
          {busy ? "Đang lưu…" : "Đặt PIN và mở nhật ký"}
        </button>
        <button type="button" onClick={onBack} className="text-sm font-semibold text-[#7a6f62]">
          ← Quay lại
        </button>
      </form>
    </>
  );
}
