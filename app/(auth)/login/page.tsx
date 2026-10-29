"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setSubmitting(false);

    if (result?.error) {
      setError("Email hoặc mật khẩu không đúng.");
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
        <span className="flex-1 text-center py-2 rounded-lg text-sm font-semibold bg-white text-[#e8829e] shadow-sm">
          Đăng nhập
        </span>
        <Link
          href="/register"
          className="flex-1 text-center py-2 rounded-lg text-sm font-semibold text-[#7a6f62]"
        >
          Đăng ký
        </Link>
      </div>

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
          <label className="text-[12.5px] font-semibold text-[#7a6f62]">Mật khẩu</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="mt-1 w-full border border-[#e7ddd0] rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#e8829e]"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Link href="/forgot-password" className="text-[12.5px] font-semibold text-[#e8829e] -mt-1 self-end">
          Quên mật khẩu?
        </Link>

        <button
          type="submit"
          disabled={submitting}
          className="mt-1.5 bg-[#e8829e] hover:bg-[#d96b89] text-white rounded-lg py-3 text-[14.5px] font-semibold disabled:opacity-60"
        >
          {submitting ? "Đang đăng nhập…" : "Đăng nhập"}
        </button>
      </form>

      <p className="text-center text-[12.5px] text-[#7a6f62] mt-4">
        Chưa có tài khoản?{" "}
        <Link href="/register" className="text-[#e8829e] font-semibold">
          Đăng ký
        </Link>
      </p>
    </div>
  );
}
