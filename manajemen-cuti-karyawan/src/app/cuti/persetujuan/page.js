"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState(null);
  const [cancelReasons, setCancelReasons] = useState({});
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

  const filteredHistory = useMemo(() => {
    if (statusFilter === "ALL") return history;
    return history.filter((item) => (item.status || "Pending") === statusFilter);
  }, [history, statusFilter]);

  async function handleCancel(cutiId) {
    setPesan("");
    const reason = (cancelReasons[cutiId] || "").trim();

    if (!reason) {
      setPesan("Alasan pembatalan wajib diisi.");
      return;
    }

    const res = await fetch("/api/cuti/riwayat", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cuti_id: cutiId,
        userId: user.user_id,
        alasan_batal: reason,
      }),
    });

    const data = await res.json();
    setPesan(data.message || "");
    if (res.ok) {
      setCancelReasons((prev) => ({ ...prev, [cutiId]: "" }));
      await loadHistory(user);
    }
  }

  function renderTimeline(item) {
    const status = item.status || "Pending";
    const step1 = `1. Diajukan pada ${new Date(item.tanggal_pengajuan).toLocaleDateString("id-ID")}`;

    let step2 = `2. Verifikasi Ketua Divisi (${item.ketua_nama || "Atasan"}): Menunggu`;
    if (status === "Approved by Leader" || status === "Approved") {
      step2 = `2. Verifikasi Ketua Divisi (${item.ketua_nama || "Atasan"}): Disetujui`;
    } else if (status === "Rejected" && item.catatan_ketdiv && !item.catatan_hrd) {
      step2 = `2. Verifikasi Ketua Divisi (${item.ketua_nama || "Atasan"}): Ditolak`;
    } else if (status === "Cancelled") {
      step2 = "2. Verifikasi Ketua Divisi: Dibatalkan sebelum diproses";
    }

    let step3 = "3. Persetujuan Final HRD: Menunggu";
    if (status === "Approved") {
      step3 = "3. Persetujuan Final HRD: Disetujui (Final)";
    } else if (status === "Rejected") {
      step3 = "3. Persetujuan Final HRD: Ditolak";
    } else if (status === "Cancelled") {
      step3 = "3. Persetujuan Final HRD: Dibatalkan";
    }

    return (
      <ul className="mt-2 space-y-1.5 border-l-2 border-[#007bff]/40 pl-3.5 text-xs text-slate-700">
        <li className="font-medium">{step1}</li>
        <li className="font-medium">{step2}</li>
        <li className="font-medium">{step3}</li>
      </ul>
    );
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
        {/* Header & Filter */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">
              Riwayat Pengajuan Cuti
            </h1>
            <nav className="mt-0.5 text-xs text-slate-500">
              <span className="text-[#007bff]">Dashboard</span> /{" "}
              <span className="text-slate-700">Riwayat Pengajuan Cuti</span>
            </nav>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <label
              htmlFor="filter-riwayat"
              className="text-xs font-semibold text-slate-700"
            >
              Filter Status:
            </label>
            <select
              id="filter-riwayat"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs focus:border-[#007bff] focus:outline-none"
            >
              <option value="ALL">Semua Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved by Leader">Approved by Leader</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {pesan && (
          <div className="rounded border border-slate-300 bg-white px-4 py-3 text-xs font-semibold text-slate-800 shadow-xs">
            {pesan}
          </div>
        )}

        {filteredHistory.length === 0 ? (
          <div className="rounded-md border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-xs">
            Belum ada riwayat pengajuan cuti.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((item) => {
              const isExpanded = expandedId === item.cuti_id;
              const currentStatus = item.status || "Pending";
              const isPending = currentStatus === "Pending";

              return (
                <div
                  key={item.cuti_id}
                  className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-xs"
                >
                  <div className="flex flex-col justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-3.5 sm:flex-row sm:items-center">
                    <div>
                      <h3 className="text-base font-bold text-slate-800">
                        {item.jenis_cuti}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Periode:{" "}
                        <span className="font-medium text-slate-700">
                          {new Date(item.mulai_cuti).toLocaleDateString("id-ID")} s/d{" "}
                          {new Date(item.selesai_cuti).toLocaleDateString("id-ID")}
                        </span>
                      </p>
                    </div>
                    <span
                      className={`inline-flex w-fit items-center rounded px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(
                        currentStatus
                      )}`}
                    >
                      {currentStatus}
                    </span>
                  </div>

                  <div className="space-y-3 p-5 text-xs sm:text-sm">
                    <div className="grid grid-cols-1 gap-2 text-slate-700 sm:grid-cols-2">
                      <p>
                        <strong className="font-semibold text-slate-900">
                          Alasan:
                        </strong>{" "}
                        {item.alasan}
                      </p>
                      <p>
                        <strong className="font-semibold text-slate-900">
                          Rekan Pengganti:
                        </strong>{" "}
                        {item.rekan_nama || item.rekan_id}
                      </p>
                    </div>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : item.cuti_id)
                        }
                        className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        {isExpanded
                          ? "Sembunyikan Detail"
                          : "Lihat Detail & Timeline"}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 rounded border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
                        <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-800">
                          Detail Pengajuan & Handover
                        </h4>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <p>
                            <strong>Catatan Tugas (Handover):</strong>{" "}
                            {item.catatan_tugas}
                          </p>
                          <p>
                            <strong>Alamat Selama Cuti:</strong> {item.alamat_cuti}
                          </p>
                          <p>
                            <strong>Nomor Darurat:</strong> {item.nomor_darurat}
                          </p>
                          <p>
                            <strong>Lampiran / Surat Dokter:</strong>{" "}
                            {item.surat_lampiran || "-"}
                          </p>
                        </div>

                        {item.catatan_ketdiv && (
                          <p className="mt-2">
                            <strong>Catatan Ketua Divisi:</strong>{" "}
                            {item.catatan_ketdiv}
                          </p>
                        )}
                        {item.catatan_hrd && (
                          <p className="mt-1">
                            <strong>Catatan HRD / Pembatalan:</strong>{" "}
                            {item.catatan_hrd}
                          </p>
                        )}

                        <h4 className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-800">
                          Timeline Approval
                        </h4>
                        {renderTimeline(item)}
                      </div>
                    )}

                    {isPending && (
                      <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center">
                        <label
                          htmlFor={`cancel-reason-${item.cuti_id}`}
                          className="shrink-0 text-xs font-semibold text-slate-700"
                        >
                          Alasan Pembatalan (Wajib):
                        </label>
                        <input
                          id={`cancel-reason-${item.cuti_id}`}
                          type="text"
                          placeholder="Tulis alasan pembatalan..."
                          value={cancelReasons[item.cuti_id] || ""}
                          onChange={(e) =>
                            setCancelReasons((prev) => ({
                              ...prev,
                              [item.cuti_id]: e.target.value,
                            }))
                          }
                          className="flex-1 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-[#007bff] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleCancel(item.cuti_id)}
                          className="shrink-0 rounded bg-[#dc3545] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700"
                        >
                          Batalkan Pengajuan
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}