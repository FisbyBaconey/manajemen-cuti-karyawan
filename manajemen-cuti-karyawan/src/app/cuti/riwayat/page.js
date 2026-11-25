"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function getStatusBadgeClass(status) {
  switch (status) {
    case "Approved":
      return "bg-[#28a745] text-white";
    case "Approved by Leader":
      return "bg-[#007bff] text-white";
    case "Rejected":
    case "Cancelled":
      return "bg-[#dc3545] text-white";
    case "Pending":
    default:
      return "bg-amber-400 text-slate-900";
  }
}

export default function RiwayatCutiPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [pesan, setPesan] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadHistory(currentUser) {
    try {
      const res = await fetch("/api/cuti/riwayat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.user_id }),
      });

      const data = await res.json();
      if (res.ok && Array.isArray(data.history)) {
        setHistory(data.history);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (!saved || saved === "undefined") {
      router.replace("/");
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(saved);
    } catch {
      router.replace("/");
      return;
    }

    if (!parsed?.user_id) {
      router.replace("/");
      return;
    }

    setUser(parsed);
    loadHistory(parsed);
  }, [router]);

  async function handleCancel(cutiId) {
    setPesan("");
    const res = await fetch("/api/cuti/riwayat", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cuti_id: cutiId,
        userId: user.user_id,
        alasan_batal: "Dibatalkan pengguna",
      }),
    });

    const data = await res.json();
    setPesan(data.message || "");
    if (res.ok) {
      await loadHistory(user);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f6f9] p-6">
        <div className="mx-auto max-w-5xl rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-xs">
          Memuat riwayat cuti...
        </div>
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f4f6f9] px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">
            Riwayat Pengajuan Cuti
          </h1>
          <nav className="text-xs text-slate-500">
            <span className="text-[#007bff]">Dashboard</span> /{" "}
            <span className="text-slate-700">Riwayat Pengajuan Cuti</span>
          </nav>
        </div>

        {pesan && (
          <div className="rounded border border-slate-300 bg-white px-4 py-3 text-xs font-semibold text-slate-800 shadow-xs">
            {pesan}
          </div>
        )}

        {history.length === 0 ? (
          <div className="rounded-md border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-xs">
            Belum ada riwayat pengajuan cuti.
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => {
              const currentStatus = item.status || "Pending";

              return (
                <div
                  key={item.cuti_id}
                  className="rounded-md border border-slate-200 bg-white p-5 shadow-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <h3 className="text-base font-bold text-slate-800">
                      {item.jenis_cuti}
                    </h3>
                    <span
                      className={`inline-flex items-center rounded px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeClass(
                        currentStatus
                      )}`}
                    >
                      {currentStatus}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-700 sm:text-sm">
                    <p>
                      <strong>Periode:</strong>{" "}
                      {new Date(item.mulai_cuti).toLocaleDateString("id-ID")}{" "}
                      s/d{" "}
                      {new Date(item.selesai_cuti).toLocaleDateString("id-ID")}
                    </p>
                    <p>
                      <strong>Alasan:</strong> {item.alasan}
                    </p>
                    <p>
                      <strong>Rekan Pengganti:</strong>{" "}
                      {item.rekan_nama || item.rekan_id}
                    </p>
                  </div>

                  {(item.status === "Pending" || !item.status) && (
                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={() => handleCancel(item.cuti_id)}
                        className="rounded bg-[#dc3545] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700"
                      >
                        Batalkan Pengajuan
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}