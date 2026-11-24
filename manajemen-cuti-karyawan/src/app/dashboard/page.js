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
          <p>Total Karyawan: {stats.totalUsers}</p>
          <p>Karyawan Aktif: {stats.activeUsers}</p>
          <p>Total Divisi: {stats.totalDivisi}</p>
          <p>Masa Kerja &lt; 1 Tahun: {stats.juniorUsers?.length ?? 0}</p>
        </div>
      )}

      {user.role === "hrd" && (
        <div>
          <p>Pengajuan Cuti Bulan Ini: {stats.totalCutiBulanIni}</p>
          <p>Jumlah Divisi: {stats.divisiList?.length ?? 0}</p>
        </div>
      )}

      {user.role === "ketdiv" && (
        <div>
          <p>Pengajuan Tim: {stats.teamCuti?.length ?? 0}</p>
        </div>
      )}

      {user.role === "user" && (
        <div>
          <p>Sisa Kuota Cuti: {stats.profile?.lama_waktu_cuti}</p>
          <p>Divisi: {stats.profile?.nama_divisi || "-"}</p>
          <p>Jumlah Cuti Sakit: {stats.jumlahCutiSakit ?? 0}</p>
        </div>
      )}
    </div>
  );
}