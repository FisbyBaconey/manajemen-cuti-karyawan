"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogOutDoubleCheck() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/logout", { method: "POST" });
      localStorage.removeItem("user");
      router.push("/");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500/30"
      >
        <span>Log Out</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-sm rounded-md border border-slate-200 bg-white p-5 shadow-lg">
            <h3 className="text-base font-semibold text-slate-800">
              Konfirmasi Keluar
            </h3>
            <p className="mt-1.5 text-sm text-slate-600">
              Yakin ingin Log Out dari sesi saat ini?
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={loggingOut}
                onClick={() => setOpen(false)}
                className="rounded border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Tidak
              </button>
              <button
                type="button"
                disabled={loggingOut}
                onClick={handleLogout}
                className="rounded bg-[#dc3545] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {loggingOut ? "Keluar..." : "Iya"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}