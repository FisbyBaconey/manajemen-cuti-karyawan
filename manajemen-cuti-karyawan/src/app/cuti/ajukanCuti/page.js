"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function AjukanCuti() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [colleagues, setColleagues] = useState([]);

  const [jenisCuti, setJenisCuti] = useState("Cuti Tahunan");
  const [setengahHari, setSetengahHari] = useState(false);
  const [mulaiCuti, setMulaiCuti] = useState("");
  const [selesaiCuti, setSelesaiCuti] = useState("");
  const [alasan, setAlasan] = useState("");
  const [rekanId, setRekanId] = useState("");
  const [catatanTugas, setCatatanTugas] = useState("");
  const [alamatCuti, setAlamatCuti] = useState("");
  const [nomorDarurat, setNomorDarurat] = useState("");
  const [suratLampiran, setSuratLampiran] = useState("");

  const [pesan, setPesan] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

    setUser(parsedUser);

    async function loadColleagues() {
      try {
        const res = await fetch("/api/cuti/ajukan");
        const rawText = await res.text();

        let data = {};
        try {
          data = rawText ? JSON.parse(rawText) : {};
        } catch {
          console.error(
            "Expected JSON from /api/cuti/ajukan, received:",
            rawText.slice(0, 200)
          );
          setPesan("Gagal memuat daftar rekan pengganti (respons server bukan JSON).");
          return;
        }

        if (!res.ok) {
          console.error("Failed to load colleagues:", data.message || res.status);
          setPesan(data.message || "Gagal memuat daftar rekan pengganti.");
          return;
        }

        if (Array.isArray(data.colleagues)) {
          setColleagues(
            data.colleagues.filter((item) => item.user_id !== parsedUser.user_id)
          );
        }
      } catch (err) {
        console.error(err);
        setPesan("Terjadi kesalahan saat memuat daftar rekan pengganti.");
      }
    }

    loadColleagues();
  }, [router]);

  const totalHari = useMemo(() => {
    if (!mulaiCuti || !selesaiCuti) return 0;

    const start = new Date(mulaiCuti);
    const end = new Date(selesaiCuti);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      return 0;
    }

    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (setengahHari) {
      return diffDays === 1 ? 0.5 : diffDays - 0.5;
    }

    return diffDays;
  }, [mulaiCuti, selesaiCuti, setengahHari]);

  function handleReset() {
    setJenisCuti("Cuti Tahunan");
    setSetengahHari(false);
    setMulaiCuti("");
    setSelesaiCuti("");
    setAlasan("");
    setRekanId("");
    setCatatanTugas("");
    setAlamatCuti("");
    setNomorDarurat("");
    setSuratLampiran("");
    setPesan("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setPesan("");

    if (!user?.user_id) {
      setPesan("Sesi pengguna tidak ditemukan.");
      return;
    }

    if (totalHari <= 0) {
      setPesan("Tanggal selesai harus sama atau setelah tanggal mulai.");
      return;
    }

    if (jenisCuti === "Cuti Sakit" && !suratLampiran.trim()) {
      setPesan("Lampiran surat dokter wajib diisi untuk Cuti Sakit.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/cuti/ajukan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.user_id,
          jenis_cuti: jenisCuti,
          setengah_hari: setengahHari,
          mulai_cuti: mulaiCuti,
          selesai_cuti: selesaiCuti,
          jumlah_hari: totalHari,
          alasan,
          rekan_id: rekanId,
          catatan_tugas: catatanTugas,
          alamat_cuti: alamatCuti,
          nomor_darurat: nomorDarurat,
          surat_lampiran: suratLampiran,
        }),
      });

      const rawText = await res.text();
      let data = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        setPesan("Respons server tidak valid saat mengirim pengajuan cuti.");
        return;
      }

      if (!res.ok) {
        setPesan(data.message || "Gagal mengajukan cuti.");
        return;
      }

      setPesan(data.message || "Pengajuan cuti berhasil dikirim!");
      handleReset();
    } catch (error) {
      console.error(error);
      setPesan("Terjadi kesalahan saat mengirim pengajuan cuti.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return <p>Memuat halaman...</p>;

  return (
    <div>
      <h1>Form Pengajuan Cuti</h1>
      <p>Tanggal Pengajuan: {new Date().toLocaleDateString("id-ID")}</p>
      <p>Total Hari Cuti: {totalHari} hari</p>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="jenis_cuti">Jenis Cuti</label>
          <select
            id="jenis_cuti"
            value={jenisCuti}
            onChange={(e) => setJenisCuti(e.target.value)}
            required
          >
            <option value="Cuti Tahunan">Cuti Tahunan</option>
            <option value="Cuti Sakit">Cuti Sakit</option>
            <option value="Cuti Lainnya">Cuti Lainnya</option>
          </select>
        </div>

        <div>
          <label htmlFor="setengah_hari">
            <input
              id="setengah_hari"
              type="checkbox"
              checked={setengahHari}
              onChange={(e) => setSetengahHari(e.target.checked)}
            />
            Cuti Setengah Hari (0.5 hari)
          </label>
        </div>

        <div>
          <label htmlFor="mulai_cuti">Tanggal Mulai</label>
          <input
            id="mulai_cuti"
            type="date"
            value={mulaiCuti}
            onChange={(e) => setMulaiCuti(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="selesai_cuti">Tanggal Selesai</label>
          <input
            id="selesai_cuti"
            type="date"
            value={selesaiCuti}
            onChange={(e) => setSelesaiCuti(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="alasan">Alasan Cuti</label>
          <textarea
            id="alasan"
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="rekan_id">Rekan Pengganti (Handover)</label>
          <select
            id="rekan_id"
            value={rekanId}
            onChange={(e) => setRekanId(e.target.value)}
            required
          >
            <option value="">-- Pilih Rekan Pengganti --</option>
            {colleagues.map((col) => (
              <option key={col.user_id} value={col.user_id}>
                {col.nama} ({col.role})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="catatan_tugas">Catatan Tugas (Handover)</label>
          <textarea
            id="catatan_tugas"
            value={catatanTugas}
            onChange={(e) => setCatatanTugas(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="alamat_cuti">Alamat Selama Cuti</label>
          <textarea
            id="alamat_cuti"
            value={alamatCuti}
            onChange={(e) => setAlamatCuti(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="nomor_darurat">Nomor Darurat</label>
          <input
            id="nomor_darurat"
            type="text"
            value={nomorDarurat}
            onChange={(e) => setNomorDarurat(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="surat_lampiran">
            Surat Dokter / Lampiran {jenisCuti === "Cuti Sakit" ? "(Wajib)" : "(Opsional)"}
          </label>
          <input
            id="surat_lampiran"
            type="text"
            placeholder="Link / nama file surat lampiran"
            value={suratLampiran}
            onChange={(e) => setSuratLampiran(e.target.value)}
          />
        </div>

        {pesan && <p>{pesan}</p>}

        <div>
          <button type="submit" disabled={submitting}>
            {submitting ? "Mengirim..." : "Submit"}
          </button>
          <button type="button" onClick={handleReset}>
            Reset
          </button>
          <button type="button" onClick={() => router.push("/dashboard")}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
