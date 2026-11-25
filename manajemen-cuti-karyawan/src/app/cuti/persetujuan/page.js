"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function PersetujuanPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [notesById, setNotesById] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pesan, setPesan] = useState("");
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

    if (parsedUser.role !== "hrd") {
      router.replace("/dashboard");
      return;
    }

    setUser(parsedUser);
    loadRequests(parsedUser);
  }, [router]);

  const filteredRequests = useMemo(() => {
    if (statusFilter === "ALL") return requests;
    return requests.filter((item) => item.status === statusFilter);
  }, [requests, statusFilter]);

  function canApproveOrReject(item) {
    return item.status === "Approved by Leader" || item.status === "Pending";
  }

  function toggleSelect(cutiId) {
    setSelectedIds((prev) =>
      prev.includes(cutiId)
        ? prev.filter((id) => id !== cutiId)
        : [...prev, cutiId]
    );
  }

  async function handleAction(cutiId, action) {
    setPesan("");
    const catatan = notesById[cutiId] || "";

    if (action === "reject" && !catatan.trim()) {
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
        setPesan(data.message || "Gagal memproses persetujuan final.");
        return;
      }

      setPesan(data.message);
      setNotesById((prev) => ({ ...prev, [cutiId]: "" }));
      setSelectedIds((prev) => prev.filter((id) => id !== cutiId));
      await loadRequests(user);
    } catch (err) {
      console.error(err);
      setPesan("Terjadi kesalahan saat memproses persetujuan final.");
    }
  }

  async function handleBulkApprove() {
    if (selectedIds.length === 0) return;
    setPesan("");

    try {
      const res = await fetch("/api/cuti/verifikasi", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cuti_ids: selectedIds,
          role: user.role,
          action: "approve",
          catatan: "Disetujui secara massal oleh HRD",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPesan(data.message || "Gagal melakukan multi-approve.");
        return;
      }

      setPesan(data.message);
      setSelectedIds([]);
      await loadRequests(user);
    } catch (err) {
      console.error(err);
      setPesan("Terjadi kesalahan saat memproses multi-approve.");
    }
  }

  if (loading) return <p>Memuat halaman persetujuan final...</p>;
  if (!user) return null;

  return (
    <div>
      <h1>Persetujuan Final Cuti (HRD)</h1>

      <div>
        <label htmlFor="filter-status">Filter Status: </label>
        <select
          id="filter-status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">Semua Status</option>
          <option value="Approved by Leader">Approved by Leader (Menunggu HRD)</option>
          <option value="Pending">Pending (Langsung ke HRD / Belum Diverifikasi)</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        {selectedIds.length > 0 && (
          <button type="button" onClick={handleBulkApprove}>
            Multi-Approve ({selectedIds.length} terpilih)
          </button>
        )}
      </div>

      {pesan && <p>{pesan}</p>}

      {filteredRequests.length === 0 ? (
        <p>Tidak ada pengajuan cuti untuk ditampilkan.</p>
      ) : (
        filteredRequests.map((item) => {
          const actionable = canApproveOrReject(item);

          return (
            <div key={item.cuti_id}>
              <hr />
              {actionable && (
                <label>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.cuti_id)}
                    onChange={() => toggleSelect(item.cuti_id)}
                  />
                  Pilih untuk Multi-Approve
                </label>
              )}

              <h3>
                {item.pemohon_nama} — {item.jenis_cuti}
              </h3>
              <p>Status: {item.status}</p>
              <p>Divisi: {item.nama_divisi || "-"}</p>
              <p>Sisa Kuota Cuti Pemohon: {item.lama_waktu_cuti ?? "-"} hari</p>
              <p>
                Tanggal Pengajuan:{" "}
                {new Date(item.tanggal_pengajuan).toLocaleDateString("id-ID")}
              </p>
              <p>
                Periode:{" "}
                {new Date(item.mulai_cuti).toLocaleDateString("id-ID")} s/d{" "}
                {new Date(item.selesai_cuti).toLocaleDateString("id-ID")}
              </p>
              <p>Alasan: {item.alasan}</p>
              <p>Rekan Pengganti: {item.rekan_nama || item.rekan_id}</p>
              <p>Catatan Tugas: {item.catatan_tugas}</p>
              <p>Alamat Cuti: {item.alamat_cuti}</p>
              <p>Nomor Darurat: {item.nomor_darurat}</p>
              {item.surat_lampiran && <p>Lampiran: {item.surat_lampiran}</p>}

              <div>
                <p>
                  <strong>Info Verifikasi Ketua Divisi:</strong>
                </p>
                <p>Ketua Divisi: {item.ketua_nama || "-"}</p>
                <p>Catatan Ketua Divisi: {item.catatan_ketdiv || "-"}</p>
              </div>

              {item.catatan_hrd && <p>Catatan HRD: {item.catatan_hrd}</p>}

              {actionable && (
                <div>
                  <label htmlFor={`note-hrd-${item.cuti_id}`}>
                    Catatan HRD (opsional untuk approve, wajib untuk reject)
                  </label>
                  <br />
                  <textarea
                    id={`note-hrd-${item.cuti_id}`}
                    value={notesById[item.cuti_id] || ""}
                    onChange={(e) =>
                      setNotesById((prev) => ({
                        ...prev,
                        [item.cuti_id]: e.target.value,
                      }))
                    }
                  />
                  <br />
                  <button
                    type="button"
                    onClick={() => handleAction(item.cuti_id, "approve")}
                  >
                    Approve Final
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction(item.cuti_id, "reject")}
                  >
                    Reject
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