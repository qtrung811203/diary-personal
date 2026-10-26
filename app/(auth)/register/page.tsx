"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Mật khẩu nhập lại không khớp.");
      return;
    }

    setSubmitting(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Đăng ký thất bại, thử lại sau.");
      setSubmitting(false);
      return;
    }

    const result = await signIn("credentials", { email, password, redirect: false });
    setSubmitting(false);

    if (result?.error) {
      setError("Tạo tài khoản thành công, nhưng đăng nhập thất bại. Hãy thử đăng nhập lại.");
      return;
    }

    router.push("/diary");
  }

  return (
    <div className="w-[380px] bg-white rounded-[20px] shadow-xl px-8 pt-9 pb-7">
      <div className="text-center mb-6">
        <div className="text-3xl mb-1">📔</div>
        <h1 className="text-lg font-semibold">Together Diary</h1>
        <p className="text-sm text-[#7a6f62] mt-1">Ghi lại từng ngày của bạn</p>
      </div>

      <div className="flex bg-[#faf6ef] rounded-xl p-1 mb-6">
        <Link
          href="/login"
          className="flex-1 text-center py-2 rounded-lg text-sm font-semibold text-[#7a6f62]"
        >
          Đăng nhập
        </Link>
        <span className="flex-1 text-center py-2 rounded-lg text-sm font-semibold bg-white text-[#c76f4b] shadow-sm">
          Đăng ký
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div>
          <label className="text-[12.5px] font-semibold text-[#7a6f62]">Tên hiển thị</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ví dụ: Trung"
            className="mt-1 w-full border border-[#e7ddd0] rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#c76f4b]"
          />
        </div>
        <div>
          <label className="text-[12.5px] font-semibold text-[#7a6f62]">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ban@email.com"
            className="mt-1 w-full border border-[#e7ddd0] rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#c76f4b]"
          />
        </div>
        <div>
          <label className="text-[12.5px] font-semibold text-[#7a6f62]">Mật khẩu</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ít nhất 8 ký tự"
            className="mt-1 w-full border border-[#e7ddd0] rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#c76f4b]"
          />
        </div>
        <div>
          <label className="text-[12.5px] font-semibold text-[#7a6f62]">Nhập lại mật khẩu</label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="mt-1 w-full border border-[#e7ddd0] rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#c76f4b]"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-1.5 bg-[#c76f4b] hover:bg-[#b45f3d] text-white rounded-lg py-3 text-[14.5px] font-semibold disabled:opacity-60"
        >
          {submitting ? "Đang tạo tài khoản…" : "Tạo tài khoản"}
        </button>
      </form>

      <p className="text-center text-[12.5px] text-[#7a6f62] mt-4">
        Đã có tài khoản?{" "}
        <Link href="/login" className="text-[#c76f4b] font-semibold">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
