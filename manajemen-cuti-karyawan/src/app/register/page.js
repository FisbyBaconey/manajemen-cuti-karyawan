"use client";

import { useState } from "react";
import Link from "next/link";

export default function SignInPage() {
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pesan, setPesan] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function addAccount(e) {
    e.preventDefault();
    setPesan("");
    setIsError(false);
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama, email, password }),
      });

      const rawText = await res.text();
      let data = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        setIsError(true);
        setPesan(`Error ${res.status}: Respons server tidak valid.`);
        return;
      }

      if (!res.ok) {
        setIsError(true);
        setPesan(data.message || "Gagal membuat akun.");
        return;
      }

      setIsError(false);
      setPesan(
        data.message ||
          "Akun berhasil dibuat dan menunggu persetujuan Admin."
      );
      setNama("");
      setEmail("");
      setPassword("");
    } catch (error) {
      console.error(error);
      setIsError(true);
      setPesan("Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f6f9] px-4 py-10">
      <div className="w-full max-w-md rounded-md border border-slate-200 border-t-4 border-t-[#007bff] bg-white p-6 shadow-sm sm:p-7">
        <div className="mb-6 text-center">
          <span className="inline-block rounded bg-blue-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#007bff]">
            E-Cuti Hasan Office
          </span>
          <h1 className="mt-2 text-xl font-bold text-slate-800">
            Daftar Akun Staff
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Akun baru akan diverifikasi oleh Admin
          </p>
        </div>

        {pesan && (
          <div
            className={`mb-4 rounded border px-3.5 py-2.5 text-xs font-medium ${
              isError
                ? "border-red-300 bg-red-50 text-red-700"
                : "border-[#28a745] bg-[#28a745] text-white"
            }`}
          >
            {pesan}
          </div>
        )}

        <form onSubmit={addAccount} className="space-y-4">
          <div>
            <label
              htmlFor="nama"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Nama Lengkap
            </label>
            <input
              id="nama"
              type="text"
              placeholder="Nama lengkap"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              required
              className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition focus:border-[#007bff] focus:outline-none focus:ring-2 focus:ring-[#007bff]/20"
            />
          </div>

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
              placeholder="Minimal 8 Karakter"
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
            {loading ? "Menyimpan..." : "Daftar"}
          </button>
        </form>

        <p className="mt-5 border-t border-slate-100 pt-4 text-center text-xs text-slate-600">
          Sudah memiliki akun?{" "}
          <Link
            href="/"
            className="font-semibold text-[#007bff] hover:underline"
          >
            Kembali ke Login
          </Link>
        </p>
      </div>
    </div>
  );
}