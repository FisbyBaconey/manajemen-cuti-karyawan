"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function getStatusBadgeClass(status) {
  switch (status) {
    case "Approved":
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

export default function VerifikasiCutiPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [notesById, setNotesById] = useState({});
  const [pesan, setPesan] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadRequests(currentUser) {
    try {
      const res = await fetch("/api/cuti/verifikasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: currentUser.role,
          userId: currentUser.user_id,
        }),
      });

      const data = await res.json();
      if (res.ok && Array.isArray(data.requests)) {
        setRequests(data.requests);
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
      localStorage.removeItem("user");
      router.replace("/");
      return;
    }

    let parsedUser;
    try {
      parsedUser = JSON.parse(saved);
    } catch {
      localStorage.removeItem("user");
      router.replace("/");
      return;
    }

    if (!parsedUser?.user_id) {
      localStorage.removeItem("user");
      router.replace("/");
      return;
    }

    if (parsedUser.role === "hrd") {
      router.replace("/cuti/persetujuanFinal");
      return;
    }

    if (parsedUser.role !== "ketdiv") {
      router.replace("/dashboard");
      return;
    }

    setUser(parsedUser);
    loadRequests(parsedUser);
  }, [router]);

  async function handleAction(cutiId, action) {
    setPesan("");
    setIsError(false);
    const catatan = notesById[cutiId] || "";

    if (action === "reject" && !catatan.trim()) {
      setIsError(true);
      setPesan("Catatan wajib diisi jika menolak pengajuan.");
      return;
    }

    try {
      const res = await fetch("/api/cuti/verifikasi", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cuti_id: cutiId,
          role: user.role,
          action,
          catatan,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setIsError(true);
        setPesan(data.message || "Gagal memproses aksi.");
        return;
      }

      setIsError(false);
      setPesan(data.message);
      setNotesById((prev) => ({ ...prev, [cutiId]: "" }));
      await loadRequests(user);
    } catch (err) {
      console.error(err);
      setIsError(true);
      setPesan("Terjadi kesalahan saat memproses pengajuan.");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f6f9] p-6">
        <div className="mx-auto max-w-5xl rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-xs">
          Memuat data verifikasi...
        </div>
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f4f6f9] px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-5">
        {/* Page Header & Breadcrumb */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">
              Verifikasi Pengajuan Cuti (Ketua Divisi)
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Tinjau dan berikan persetujuan awal untuk pengajuan cuti anggota divisi
            </p>
          </div>
          <nav className="text-xs text-slate-500">
            <span className="text-[#007bff]">Dashboard</span> /{" "}
            <span className="text-slate-700">Verifikasi Pengajuan Cuti</span>
          </nav>
        </div>

        {pesan && (
          <div
            className={`rounded border px-4 py-3 text-xs font-semibold shadow-xs ${
              isError
                ? "border-red-300 bg-red-50 text-red-700"
                : "border-[#28a745] bg-[#28a745] text-white"
            }`}
          >
            {pesan}
          </div>
        )}

        {requests.length === 0 ? (
          <div className="rounded-md border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-xs">
            Tidak ada pengajuan cuti untuk ditampilkan.
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((item) => {
              const canAct = item.status === "Pending";

              return (
                <div
                  key={item.cuti_id}
                  className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-xs"
                >
                  <div className="flex flex-col justify-between gap-2 border-b border-slate-200 bg-slate-50/70 px-5 py-3.5 sm:flex-row sm:items-center">
                    <div>
                      <h3 className="text-base font-bold text-slate-800">
                        {item.pemohon_nama}{" "}
                        <span className="font-normal text-slate-400">—</span>{" "}
                        <span className="text-[#007bff]">{item.jenis_cuti}</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Tanggal Pengajuan:{" "}
                        {new Date(item.tanggal_pengajuan).toLocaleDateString(
                          "id-ID"
                        )}
                      </p>
                    </div>
                    <span
                      className={`inline-flex w-fit items-center rounded px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="space-y-4 p-5 text-xs text-slate-700 sm:text-sm">
                    <div className="grid grid-cols-1 gap-3 rounded border border-slate-100 bg-slate-50/60 p-3.5 sm:grid-cols-2">
                      <p>
                        <strong className="font-semibold text-slate-900">
                          Periode:
                        </strong>{" "}
                        {new Date(item.mulai_cuti).toLocaleDateString("id-ID")}{" "}
                        s/d{" "}
                        {new Date(item.selesai_cuti).toLocaleDateString("id-ID")}
                      </p>
                      <p>
                        <strong className="font-semibold text-slate-900">
                          Rekan Pengganti:
                        </strong>{" "}
                        {item.rekan_nama || item.rekan_id}
                      </p>
                      <p>
                        <strong className="font-semibold text-slate-900">
                          Nomor Darurat:
                        </strong>{" "}
                        {item.nomor_darurat}
                      </p>
                      <p>
                        <strong className="font-semibold text-slate-900">
                          Alamat Cuti:
                        </strong>{" "}
                        {item.alamat_cuti}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Alasan
                        </p>
                        <p className="mt-1 text-slate-800">{item.alasan}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Catatan Tugas
                        </p>
                        <p className="mt-1 text-slate-800">
                          {item.catatan_tugas}
                        </p>
                      </div>
                    </div>

                    {item.surat_lampiran && (
                      <div className="rounded border border-blue-100 bg-blue-50/50 px-3.5 py-2 text-xs text-slate-700">
                        <strong className="font-semibold text-slate-900">
                          Lampiran:
                        </strong>{" "}
                        {item.surat_lampiran}
                      </div>
                    )}

                    {(item.catatan_ketdiv || item.catatan_hrd) && (
                      <div className="space-y-1 border-t border-slate-100 pt-3 text-xs">
                        {item.catatan_ketdiv && (
                          <p>
                            <strong>Catatan Ketua Divisi:</strong>{" "}
                            {item.catatan_ketdiv}
                          </p>
                        )}
                        {item.catatan_hrd && (
                          <p>
                            <strong>Catatan HRD:</strong> {item.catatan_hrd}
                          </p>
                        )}
                      </div>
                    )}

                    {canAct && (
                      <div className="border-t border-slate-200 pt-4">
                        <label
                          htmlFor={`note-${item.cuti_id}`}
                          className="mb-1.5 block text-xs font-semibold text-slate-700"
                        >
                          Catatan (opsional untuk approve, wajib untuk reject)
                        </label>
                        <textarea
                          id={`note-${item.cuti_id}`}
                          rows={2}
                          value={notesById[item.cuti_id] || ""}
                          onChange={(e) =>
                            setNotesById((prev) => ({
                              ...prev,
                              [item.cuti_id]: e.target.value,
                            }))
                          }
                          className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 transition focus:border-[#007bff] focus:outline-none focus:ring-2 focus:ring-[#007bff]/20 sm:text-sm"
                        />
                        <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleAction(item.cuti_id, "reject")}
                            className="rounded bg-[#dc3545] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAction(item.cuti_id, "approve")}
                            className="rounded bg-[#007bff] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-600"
                          >
                            Approve
                          </button>
                        </div>
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