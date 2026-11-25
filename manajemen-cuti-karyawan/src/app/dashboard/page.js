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

  if (!user || !stats) {
    return (
      <div className="min-h-screen bg-[#f4f6f9] p-4">
        <div className="mx-auto max-w-6xl rounded border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 shadow-2xs">
          Memuat dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9] px-3 py-4 sm:px-5">
      <div className="mx-auto max-w-6xl space-y-4">
        {/* Compact Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200 bg-white px-4 py-2.5 shadow-2xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-base font-bold text-slate-800 sm:text-lg">
              Dashboard - {user.nama}
            </h1>
            <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-semibold uppercase text-[#007bff]">
              {user.role}
            </span>
          </div>
          <nav className="text-[11px] text-slate-500">
            <span className="text-[#007bff]">Home</span> /{" "}
            <span className="text-slate-700">Dashboard</span>
          </nav>
        </div>

        {/* ADMIN COMPACT VIEW */}
        {user.role === "admin" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
              <div className="rounded border border-slate-200 border-l-3 border-l-[#007bff] bg-white px-3 py-2.5 shadow-2xs">
                <p className="text-[11px] font-medium text-slate-500">
                  Total Karyawan
                </p>
                <p className="mt-0.5 text-lg font-bold text-slate-800">
                  {stats.totalUsers ?? 0}
                </p>
              </div>
              <div className="rounded border border-slate-200 border-l-3 border-l-[#28a745] bg-white px-3 py-2.5 shadow-2xs">
                <p className="text-[11px] font-medium text-slate-500">
                  Karyawan Aktif
                </p>
                <p className="mt-0.5 text-lg font-bold text-[#28a745]">
                  {stats.activeUsers ?? 0}
                </p>
              </div>
              <div className="rounded border border-slate-200 border-l-3 border-l-slate-400 bg-white px-3 py-2.5 shadow-2xs">
                <p className="text-[11px] font-medium text-slate-500">
                  Tidak Aktif
                </p>
                <p className="mt-0.5 text-lg font-bold text-slate-700">
                  {stats.inactiveUsers ?? 0}
                </p>
              </div>
              <div className="rounded border border-slate-200 border-l-3 border-l-indigo-500 bg-white px-3 py-2.5 shadow-2xs">
                <p className="text-[11px] font-medium text-slate-500">
                  Total Divisi
                </p>
                <p className="mt-0.5 text-lg font-bold text-slate-800">
                  {stats.totalDivisi ?? 0}
                </p>
              </div>
              <div className="rounded border border-slate-200 border-l-3 border-l-sky-500 bg-white px-3 py-2.5 shadow-2xs">
                <p className="text-[11px] font-medium text-slate-500">
                  Cuti Bulan Ini
                </p>
                <p className="mt-0.5 text-lg font-bold text-slate-800">
                  {stats.totalCutiBulanIni ?? 0}
                </p>
              </div>
              <div className="rounded border border-slate-200 border-l-3 border-l-amber-400 bg-white px-3 py-2.5 shadow-2xs">
                <p className="text-[11px] font-medium text-slate-500">
                  Pending Approval
                </p>
                <p className="mt-0.5 text-lg font-bold text-amber-600">
                  {stats.pendingApproval ?? 0}
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded border border-slate-200 bg-white shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3.5 py-2">
                <h3 className="text-xs font-semibold text-slate-800">
                  Karyawan Masa Kerja &lt; 1 Tahun
                </h3>
                <span className="rounded bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                  {stats.juniorUsers?.length ?? 0}
                </span>
              </div>
              <div className="max-h-60 overflow-y-auto px-3.5 py-2">
                {stats.juniorUsers?.length > 0 ? (
                  <ul className="divide-y divide-slate-100 text-xs">
                    {stats.juniorUsers.map((u) => (
                      <li
                        key={u.user_id}
                        className="flex items-center justify-between py-1.5"
                      >
                        <span className="font-medium text-slate-800">
                          {u.nama}
                        </span>
                        <span className="rounded bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                          Masa kerja: {u.masa_kerja} tahun
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="py-2 text-xs text-slate-500">
                    Tidak ada karyawan dengan masa kerja di bawah 1 tahun.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* HRD COMPACT VIEW */}
        {user.role === "hrd" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded border border-slate-200 border-l-3 border-l-[#007bff] bg-white px-3.5 py-2.5 shadow-2xs">
                <p className="text-[11px] font-medium text-slate-500">
                  Total Pengajuan Cuti Bulan Ini
                </p>
                <p className="mt-0.5 text-lg font-bold text-slate-800">
                  {stats.totalCutiBulanIni ?? 0}
                </p>
              </div>
              <div className="rounded border border-slate-200 border-l-3 border-l-amber-400 bg-white px-3.5 py-2.5 shadow-2xs">
                <p className="text-[11px] font-medium text-slate-500">
                  Pending Final Approval
                </p>
                <p className="mt-0.5 text-lg font-bold text-amber-600">
                  {stats.pendingFinalApproval ?? 0}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="overflow-hidden rounded border border-slate-200 bg-white shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3.5 py-2">
                  <h3 className="text-xs font-semibold text-slate-800">
                    Karyawan yang Sedang Cuti Bulan Ini
                  </h3>
                  <span className="rounded bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-[#007bff]">
                    {stats.sedangCutiBulanIni?.length ?? 0}
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto px-3.5 py-2">
                  {stats.sedangCutiBulanIni?.length > 0 ? (
                    <ul className="divide-y divide-slate-100 text-xs">
                      {stats.sedangCutiBulanIni.map((c) => (
                        <li
                          key={c.cuti_id}
                          className="flex flex-wrap items-center justify-between gap-1 py-1.5"
                        >
                          <div>
                            <span className="font-semibold text-slate-800">
                              {c.nama}
                            </span>{" "}
                            <span className="text-[11px] text-slate-500">
                              ({c.nama_divisi || "-"}) — {c.jenis_cuti}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-600">
                            {new Date(c.mulai_cuti).toLocaleDateString("id-ID")}{" "}
                            s/d{" "}
                            {new Date(c.selesai_cuti).toLocaleDateString(
                              "id-ID"
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="py-2 text-xs text-slate-500">
                      Tidak ada karyawan yang sedang cuti bulan ini.
                    </p>
                  )}
                </div>
              </div>

              <div className="overflow-hidden rounded border border-slate-200 bg-white shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3.5 py-2">
                  <h3 className="text-xs font-semibold text-slate-800">
                    Daftar Divisi
                  </h3>
                  <span className="rounded bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                    {stats.divisiList?.length ?? 0}
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto px-3.5 py-2">
                  {stats.divisiList?.length > 0 ? (
                    <ul className="divide-y divide-slate-100 text-xs">
                      {stats.divisiList.map((d) => (
                        <li
                          key={d.divisi_id}
                          className="flex items-center justify-between gap-2 py-1.5"
                        >
                          <div>
                            <span className="font-semibold text-slate-800">
                              {d.nama_divisi}
                            </span>
                            <span className="ml-2 text-[11px] text-slate-500">
                              Ketua: {d.ketua_nama || "-"}
                            </span>
                          </div>
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                            {d.jumlah_anggota ?? 0} anggota
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="py-2 text-xs text-slate-500">
                      Belum ada data divisi.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* KETUA DIVISI COMPACT VIEW */}
        {user.role === "ketdiv" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded border border-slate-200 border-l-3 border-l-[#007bff] bg-white px-3.5 py-2.5 shadow-2xs">
                <p className="text-[11px] font-medium text-slate-500">
                  Total Pengajuan Cuti Masuk
                </p>
                <p className="mt-0.5 text-lg font-bold text-slate-800">
                  {stats.teamCuti?.length ?? 0}
                </p>
              </div>
              <div className="rounded border border-slate-200 border-l-3 border-l-amber-400 bg-white px-3.5 py-2.5 shadow-2xs">
                <p className="text-[11px] font-medium text-slate-500">
                  Pending Verifikasi
                </p>
                <p className="mt-0.5 text-lg font-bold text-amber-600">
                  {stats.pendingVerifikasi ?? 0}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="overflow-hidden rounded border border-slate-200 bg-white shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3.5 py-2">
                  <h3 className="text-xs font-semibold text-slate-800">
                    Sedang Cuti Minggu Ini
                  </h3>
                  <span className="rounded bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-[#007bff]">
                    {stats.cutiMingguIni?.length ?? 0}
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto px-3.5 py-2">
                  {stats.cutiMingguIni?.length > 0 ? (
                    <ul className="divide-y divide-slate-100 text-xs">
                      {stats.cutiMingguIni.map((c) => (
                        <li
                          key={c.cuti_id}
                          className="flex flex-wrap items-center justify-between gap-1 py-1.5"
                        >
                          <div>
                            <span className="font-semibold text-slate-800">
                              {c.nama}
                            </span>{" "}
                            <span className="text-[#007bff]">
                              ({c.jenis_cuti})
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-600">
                            {new Date(c.mulai_cuti).toLocaleDateString("id-ID")}{" "}
                            s/d{" "}
                            {new Date(c.selesai_cuti).toLocaleDateString(
                              "id-ID"
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="py-2 text-xs text-slate-500">
                      Tidak ada anggota divisi yang sedang cuti minggu ini.
                    </p>
                  )}
                </div>
              </div>

              <div className="overflow-hidden rounded border border-slate-200 bg-white shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3.5 py-2">
                  <h3 className="text-xs font-semibold text-slate-800">
                    Daftar Anggota Divisi
                  </h3>
                  <span className="rounded bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                    {stats.anggotaDivisi?.length ?? 0}
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto px-3.5 py-2">
                  {stats.anggotaDivisi?.length > 0 ? (
                    <ul className="divide-y divide-slate-100 text-xs">
                      {stats.anggotaDivisi.map((a) => (
                        <li
                          key={a.user_id}
                          className="flex items-center justify-between py-1.5"
                        >
                          <div>
                            <span className="font-semibold text-slate-800">
                              {a.nama}
                            </span>
                            <span className="ml-1.5 text-[11px] text-slate-500">
                              ({a.role})
                            </span>
                          </div>
                          <span
                            className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
                              a.aktif
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {a.aktif ? "Aktif" : "Tidak Aktif"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="py-2 text-xs text-slate-500">
                      Belum ada anggota divisi.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STAFF / USER COMPACT VIEW */}
        {user.role === "user" && (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded border border-slate-200 border-l-3 border-l-[#28a745] bg-white px-3.5 py-2.5 shadow-2xs">
              <p className="text-[11px] font-medium text-slate-500">
                Sisa Kuota Cuti
              </p>
              <p className="mt-0.5 text-lg font-bold text-[#28a745]">
                {stats.profile?.lama_waktu_cuti ?? 0} hari
              </p>
            </div>
            <div className="rounded border border-slate-200 border-l-3 border-l-amber-400 bg-white px-3.5 py-2.5 shadow-2xs">
              <p className="text-[11px] font-medium text-slate-500">
                Cuti Sakit Diajukan
              </p>
              <p className="mt-0.5 text-lg font-bold text-slate-800">
                {stats.jumlahCutiSakit ?? 0}
              </p>
            </div>
            <div className="rounded border border-slate-200 border-l-3 border-l-[#007bff] bg-white px-3.5 py-2.5 shadow-2xs">
              <p className="text-[11px] font-medium text-slate-500">
                Total Pengajuan
              </p>
              <p className="mt-0.5 text-lg font-bold text-[#007bff]">
                {stats.totalPengajuanCuti ?? 0}
              </p>
            </div>
            <div className="rounded border border-slate-200 border-l-3 border-l-slate-400 bg-white px-3.5 py-2.5 shadow-2xs">
              <p className="text-[11px] font-medium text-slate-500">Divisi</p>
              <p className="mt-0.5 truncate text-sm font-bold text-slate-800">
                {stats.profile?.nama_divisi || "-"}
              </p>
            </div>
            <div className="rounded border border-slate-200 border-l-3 border-l-indigo-500 bg-white px-3.5 py-2.5 shadow-2xs">
              <p className="text-[11px] font-medium text-slate-500">
                Ketua Divisi
              </p>
              <p className="mt-0.5 truncate text-sm font-bold text-slate-800">
                {stats.profile?.ketua_nama || "-"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}