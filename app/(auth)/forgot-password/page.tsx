"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PinInput from "@/components/PinInput";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin.length !== 6) return setError("Mã PIN phải gồm đúng 6 chữ số.");
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, pin, newPassword: password }),
    }).catch(() => null);
    setSubmitting(false);
    if (!res) return setError("Không kết nối được máy chủ.");
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setDone(true);
      setTimeout(() => router.push("/login"), 1800);
      return;
    }
    if (res.status === 429) {
      const t = new Date(data.lockedUntil).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false });
      return setError(`Nhập sai quá 5 lần. Thử lại sau ${t}.`);
    }
    setError(data.error ?? "Có lỗi xảy ra, thử lại nhé.");
  }

  return (
    <div className="w-[380px] max-w-full bg-white rounded-[20px] shadow-xl px-8 pt-9 pb-7">
      <div className="text-center mb-6">
        <div className="text-3xl mb-1">🔑</div>
        <h1 className="text-lg font-semibold">Quên mật khẩu</h1>
        <p className="text-sm text-[#7a6f62] mt-1">Dùng email và mã PIN 6 số để đặt mật khẩu mới.</p>
      </div>

      {done ? (
        <p className="text-center text-sm text-[#3a332c] py-6">Đã đổi mật khẩu. Đang chuyển tới trang đăng nhập…</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div>
            <label className="text-[12.5px] font-semibold text-[#7a6f62]">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ban@email.com"
              className="mt-1 w-full border border-[#e7ddd0] rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#e8829e]"
            />
          </div>
          <div>
            <label className="text-[12.5px] font-semibold text-[#7a6f62] block mb-1.5">Mã PIN</label>
            <PinInput label="Mã PIN" value={pin} onChange={setPin} />
          </div>
          <div>
            <label className="text-[12.5px] font-semibold text-[#7a6f62]">Mật khẩu mới</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ít nhất 8 ký tự"
              className="mt-1 w-full border border-[#e7ddd0] rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#e8829e]"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1.5 bg-[#e8829e] hover:bg-[#d96b89] text-white rounded-lg py-3 text-[14.5px] font-semibold disabled:opacity-60"
          >
            {submitting ? "Đang lưu…" : "Đặt mật khẩu mới"}
          </button>
        </form>
      )}

      <p className="text-center text-[12.5px] text-[#7a6f62] mt-4">
        <Link href="/login" className="text-[#e8829e] font-semibold">
          ← Về đăng nhập
        </Link>
      </p>
    </div>
  );
}
