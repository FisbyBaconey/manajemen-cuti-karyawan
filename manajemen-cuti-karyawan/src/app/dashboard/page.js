"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);

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

    if (!parsedUser || !parsedUser.user_id) {
      localStorage.removeItem("user");
      router.replace("/");
      return;
    }

    setUser(parsedUser);

    async function loadDashboard() {
      try {
        const res = await fetch("/api/dashboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: parsedUser.role,
            userId: parsedUser.user_id,
          }),
        });

        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error(err);
        setStats({});
      }
    }

    loadDashboard();
  }, [router]);

  if (!user || !stats) return <p>Memuat dashboard...</p>;

  return (
    <div>
      <h1>Dashboard - {user.nama}</h1>
      <p>Role: {user.role}</p>

      {user.role === "admin" && (
        <div>
          <p>Total Karyawan: {stats.totalUsers ?? 0}</p>
          <p>Karyawan Aktif: {stats.activeUsers ?? 0}</p>
          <p>Karyawan Tidak Aktif: {stats.inactiveUsers ?? 0}</p>
          <p>Total Divisi: {stats.totalDivisi ?? 0}</p>
          <p>Total Pengajuan Cuti Bulan Ini: {stats.totalCutiBulanIni ?? 0}</p>
          <p>Pengajuan Pending Approval: {stats.pendingApproval ?? 0}</p>

          <h3>Karyawan Masa Kerja &lt; 1 Tahun ({stats.juniorUsers?.length ?? 0})</h3>
          {stats.juniorUsers?.length > 0 ? (
            <ul>
              {stats.juniorUsers.map((u) => (
                <li key={u.user_id}>
                  {u.nama} (Masa kerja: {u.masa_kerja} tahun)
                </li>
              ))}
            </ul>
          ) : (
            <p>Tidak ada karyawan dengan masa kerja di bawah 1 tahun.</p>
          )}
        </div>
      )}

      {user.role === "hrd" && (
        <div>
          <p>Total Pengajuan Cuti Bulan Ini: {stats.totalCutiBulanIni ?? 0}</p>
          <p>Pengajuan Pending Final Approval: {stats.pendingFinalApproval ?? 0}</p>

          <h3>Karyawan yang Sedang Cuti Bulan Ini ({stats.sedangCutiBulanIni?.length ?? 0})</h3>
          {stats.sedangCutiBulanIni?.length > 0 ? (
            <ul>
              {stats.sedangCutiBulanIni.map((c) => (
                <li key={c.cuti_id}>
                  {c.nama} ({c.nama_divisi || "-"}) — {c.jenis_cuti} (
                  {new Date(c.mulai_cuti).toLocaleDateString("id-ID")} s/d{" "}
                  {new Date(c.selesai_cuti).toLocaleDateString("id-ID")})
                </li>
              ))}
            </ul>
          ) : (
            <p>Tidak ada karyawan yang sedang cuti bulan ini.</p>
          )}

          <h3>Daftar Divisi ({stats.divisiList?.length ?? 0})</h3>
          {stats.divisiList?.length > 0 ? (
            <ul>
              {stats.divisiList.map((d) => (
                <li key={d.divisi_id}>
                  {d.nama_divisi} — Ketua: {d.ketua_nama || "-"} — Anggota: {d.jumlah_anggota ?? 0}
                </li>
              ))}
            </ul>
          ) : (
            <p>Belum ada data divisi.</p>
          )}
        </div>
      )}

      {user.role === "ketdiv" && (
        <div>
          <p>Total Pengajuan Cuti Masuk: {stats.teamCuti?.length ?? 0}</p>
          <p>Pengajuan Pending Verifikasi: {stats.pendingVerifikasi ?? 0}</p>

          <h3>Anggota Divisi yang Sedang Cuti Minggu Ini ({stats.cutiMingguIni?.length ?? 0})</h3>
          {stats.cutiMingguIni?.length > 0 ? (
            <ul>
              {stats.cutiMingguIni.map((c) => (
                <li key={c.cuti_id}>
                  {c.nama} — {c.jenis_cuti} (
                  {new Date(c.mulai_cuti).toLocaleDateString("id-ID")} s/d{" "}
                  {new Date(c.selesai_cuti).toLocaleDateString("id-ID")})
                </li>
              ))}
            </ul>
          ) : (
            <p>Tidak ada anggota divisi yang sedang cuti minggu ini.</p>
          )}

          <h3>Daftar Anggota Divisi ({stats.anggotaDivisi?.length ?? 0})</h3>
          {stats.anggotaDivisi?.length > 0 ? (
            <ul>
              {stats.anggotaDivisi.map((a) => (
                <li key={a.user_id}>
                  {a.nama} ({a.role}) — {a.aktif ? "Aktif" : "Tidak Aktif"}
                </li>
              ))}
            </ul>
          ) : (
            <p>Belum ada anggota divisi.</p>
          )}
        </div>
      )}

      {user.role === "user" && (
        <div>
          <p>Sisa Kuota Cuti Tahunan: {stats.profile?.lama_waktu_cuti ?? 0} hari</p>
          <p>Jumlah Cuti Sakit Diajukan: {stats.jumlahCutiSakit ?? 0}</p>
          <p>Total Pengajuan Cuti: {stats.totalPengajuanCuti ?? 0}</p>
          <p>Nama Divisi: {stats.profile?.nama_divisi || "-"}</p>
          <p>Ketua Divisi: {stats.profile?.ketua_nama || "-"}</p>
        </div>
      )}
    </div>
  );
}