"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pesan, setPesan] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setPesan("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPesan(data.message || "Email atau password salah.");
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setPesan("Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f6f9] px-4 py-10">
      <div className="w-full max-w-md rounded-md border border-slate-200 border-t-4 border-t-[#007bff] bg-white p-6 shadow-sm sm:p-7">
        <div className="mb-6 text-center">
          <span className="inline-block rounded bg-blue-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#007bff]">
            Sistem Informasi Kepegawaian
          </span>
          <h1 className="mt-2 text-xl font-bold text-slate-800">
            E-Cuti Hasan Office
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Silakan masuk ke akun organisasi Anda
          </p>
        </div>

        {pesan && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
            {pesan}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition focus:border-[#007bff] focus:outline-none focus:ring-2 focus:ring-[#007bff]/20"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition focus:border-[#007bff] focus:outline-none focus:ring-2 focus:ring-[#007bff]/20"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-[#007bff] px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-[#007bff]/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Memproses..." : "Login"}
          </button>
        </form>

        <p className="mt-5 border-t border-slate-100 pt-4 text-center text-xs text-slate-600">
          Belum punya akun?{" "}
          <Link
            href="/signin"
            className="font-semibold text-[#007bff] hover:underline"
          >
            Daftar di sini
          </Link>
        </p>
      </div>
    </div>
  );
}