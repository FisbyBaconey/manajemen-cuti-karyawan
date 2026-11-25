"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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
      <ul>
        <li>{step1}</li>
        <li>{step2}</li>
        <li>{step3}</li>
      </ul>
    );
  }

  if (loading) return <p>Memuat riwayat cuti...</p>;
  if (!user) return null;

  return (
    <div>
      <h1>Riwayat Pengajuan Cuti</h1>

      <div>
        <label htmlFor="filter-riwayat">Filter Status: </label>
        <select
          id="filter-riwayat"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">Semua Status</option>
          <option value="Pending">Pending</option>
          <option value="Approved by Leader">Approved by Leader</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {pesan && <p>{pesan}</p>}

      {filteredHistory.length === 0 ? (
        <p>Belum ada riwayat pengajuan cuti.</p>
      ) : (
        filteredHistory.map((item) => {
          const isExpanded = expandedId === item.cuti_id;
          const isPending = (item.status || "Pending") === "Pending";

          return (
            <div key={item.cuti_id}>
              <hr />
              <h3>{item.jenis_cuti}</h3>
              <p>Status: {item.status || "Pending"}</p>
              <p>
                Periode: {new Date(item.mulai_cuti).toLocaleDateString("id-ID")} s/d{" "}
                {new Date(item.selesai_cuti).toLocaleDateString("id-ID")}
              </p>
              <p>Alasan: {item.alasan}</p>
              <p>Rekan Pengganti: {item.rekan_nama || item.rekan_id}</p>

              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : item.cuti_id)}
              >
                {isExpanded ? "Sembunyikan Detail" : "Lihat Detail & Timeline"}
              </button>

              {isExpanded && (
                <div>
                  <h4>Detail Pengajuan & Handover</h4>
                  <p>Catatan Tugas (Handover): {item.catatan_tugas}</p>
                  <p>Alamat Selama Cuti: {item.alamat_cuti}</p>
                  <p>Nomor Darurat: {item.nomor_darurat}</p>
                  <p>Lampiran / Surat Dokter: {item.surat_lampiran || "-"}</p>
                  {item.catatan_ketdiv && (
                    <p>Catatan Ketua Divisi: {item.catatan_ketdiv}</p>
                  )}
                  {item.catatan_hrd && (
                    <p>Catatan HRD / Pembatalan: {item.catatan_hrd}</p>
                  )}

                  <h4>Timeline Approval</h4>
                  {renderTimeline(item)}
                </div>
              )}

              {isPending && (
                <div>
                  <label htmlFor={`cancel-reason-${item.cuti_id}`}>
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
                  />
                  <button type="button" onClick={() => handleCancel(item.cuti_id)}>
                    Batalkan Pengajuan
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}