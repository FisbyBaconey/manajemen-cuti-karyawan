"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function VerifikasiCutiPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [notesById, setNotesById] = useState({});
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

    if (parsedUser.role !== "ketdiv" && parsedUser.role !== "hrd") {
      router.replace("/dashboard");
      return;
    }

    setUser(parsedUser);
    loadRequests(parsedUser);
  }, [router]);

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
        setPesan(data.message || "Gagal memproses aksi.");
        return;
      }

      setPesan(data.message);
      setNotesById((prev) => ({ ...prev, [cutiId]: "" }));
      await loadRequests(user);
    } catch (err) {
      console.error(err);
      setPesan("Terjadi kesalahan saat memproses pengajuan.");
    }
  }

  if (loading) return <p>Memuat data verifikasi...</p>;
  if (!user) return null;

  return (
    <div>
      <h1>
        {user.role === "hrd"
          ? "Persetujuan Final Cuti (HRD)"
          : "Verifikasi Pengajuan Cuti (Ketua Divisi)"}
      </h1>

      {pesan && <p>{pesan}</p>}

      {requests.length === 0 ? (
        <p>Tidak ada pengajuan cuti untuk ditampilkan.</p>
      ) : (
        requests.map((item) => {
          const canAct =
            (user.role === "ketdiv" && item.status === "Pending") ||
            (user.role === "hrd" &&
              (item.status === "Approved by Leader" || item.status === "Pending"));

          return (
            <div key={item.cuti_id}>
              <hr />
              <h3>
                {item.pemohon_nama} — {item.jenis_cuti}
              </h3>
              <p>Status: {item.status}</p>
              {item.nama_divisi && <p>Divisi: {item.nama_divisi}</p>}
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
              {item.catatan_ketdiv && <p>Catatan Ketua Divisi: {item.catatan_ketdiv}</p>}
              {item.catatan_hrd && <p>Catatan HRD: {item.catatan_hrd}</p>}

              {canAct && (
                <div>
                  <label htmlFor={`note-${item.cuti_id}`}>
                    Catatan (opsional untuk approve, wajib untuk reject)
                  </label>
                  <br />
                  <textarea
                    id={`note-${item.cuti_id}`}
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
                    Approve
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