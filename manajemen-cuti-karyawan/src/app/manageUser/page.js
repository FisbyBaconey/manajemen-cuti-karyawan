"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PendingList from "@/components/pendingList";

export default function ManageUser() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [divisiList, setDivisiList] = useState([]);
  const [pesan, setPesan] = useState("");
  const [loading, setLoading] = useState(true);

  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [divisiId, setDivisiId] = useState("1");
  const [kuotaAwal, setKuotaAwal] = useState("12");

  const [namaDivisi, setNamaDivisi] = useState("");
  const [deskripsiDivisi, setDeskripsiDivisi] = useState("");
  const [ketuaId, setKetuaId] = useState("");

  async function loadAdminData() {
    try {
      const res = await fetch("/api/manageUser");
      const data = await res.json();
      if (res.ok) {
        setUsersList(data.users || []);
        setDivisiList(data.divisiList || []);
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

    if (parsed.role !== "admin") {
      router.replace("/dashboard");
      return;
    }

    setUser(parsed);
    loadAdminData();
  }, [router]);

  async function handleCreateUser(e) {
    e.preventDefault();
    setPesan("");

    const res = await fetch("/api/manageUser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "user",
        nama,
        email,
        password,
        role,
        divisi_id: divisiId,
        lama_waktu_cuti: kuotaAwal,
      }),
    });

    const data = await res.json();
    setPesan(data.message || "");
    if (res.ok) {
      setNama("");
      setEmail("");
      setPassword("");
      setRole("user");
      setDivisiId("1");
      setKuotaAwal("12");
      await loadAdminData();
    }
  }

  async function handleCreateDivisi(e) {
    e.preventDefault();
    setPesan("");

    const res = await fetch("/api/manageUser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "divisi",
        nama_divisi: namaDivisi,
        deskripsi_divisi: deskripsiDivisi,
        ketua_divisi_id: ketuaId || null,
      }),
    });

    const data = await res.json();
    setPesan(data.message || "");
    if (res.ok) {
      setNamaDivisi("");
      setDeskripsiDivisi("");
      setKetuaId("");
      await loadAdminData();
    }
  }

  async function handleDelete(type, id) {
    setPesan("");
    const res = await fetch("/api/manageUser", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id }),
    });

    const data = await res.json();
    setPesan(data.message || "");
    if (res.ok) {
      await loadAdminData();
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f6f9] p-4">
        <div className="mx-auto max-w-6xl rounded border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 shadow-2xs">
          Memuat panel admin...
        </div>
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f4f6f9] px-3 py-4 sm:px-5">
      <div className="mx-auto max-w-6xl space-y-4">
        {/* Compact Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200 bg-white px-4 py-2.5 shadow-2xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-base font-bold text-slate-800 sm:text-lg">
              Panel Admin
            </h1>
            <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-[#007bff]">
              {usersList.length} Pengguna • {divisiList.length} Divisi
            </span>
          </div>
          <nav className="text-[11px] text-slate-500">
            <span className="text-[#007bff]">Dashboard</span> /{" "}
            <span className="text-slate-700">Panel Admin</span>
          </nav>
        </div>

        {pesan && (
          <div className="rounded border border-[#28a745] bg-[#28a745] px-3.5 py-2 text-xs font-semibold text-white shadow-2xs">
            {pesan}
          </div>
        )}

        {/* Pending Approvals */}
        <PendingList onUserApproved={loadAdminData} />

        {/* COMPACT USER MANAGEMENT */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <form
            onSubmit={handleCreateUser}
            className="overflow-hidden rounded border border-slate-200 bg-white shadow-2xs lg:col-span-5"
          >
            <div className="border-b border-slate-200 bg-slate-50 px-3.5 py-2">
              <h2 className="text-xs font-semibold text-slate-800">
                Tambah Pengguna
              </h2>
            </div>
            <div className="space-y-2.5 p-3.5 text-xs">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                    Nama Lengkap
                  </label>
                  <input
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    required
                    className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#007bff] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#007bff] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#007bff] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#007bff] focus:outline-none"
                  >
                    <option value="user">user</option>
                    <option value="ketdiv">ketdiv</option>
                    <option value="hrd">hrd</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                    Kuota Awal
                  </label>
                  <input
                    type="number"
                    value={kuotaAwal}
                    onChange={(e) => setKuotaAwal(e.target.value)}
                    required
                    className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#007bff] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2.5 pt-0.5 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                    Divisi
                  </label>
                  <select
                    value={divisiId}
                    onChange={(e) => setDivisiId(e.target.value)}
                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#007bff] focus:outline-none"
                  >
                    {divisiList.map((d) => (
                      <option key={d.divisi_id} value={d.divisi_id}>
                        {d.nama_divisi}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="shrink-0 rounded bg-[#007bff] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-600"
                >
                  Simpan Pengguna
                </button>
              </div>
            </div>
          </form>

          <div className="overflow-hidden rounded border border-slate-200 bg-white shadow-2xs lg:col-span-7">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3.5 py-2">
              <h3 className="text-xs font-semibold text-slate-800">
                Daftar Pengguna
              </h3>
              <span className="rounded bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                {usersList.length}
              </span>
            </div>
            <div className="max-h-64 overflow-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="sticky top-0 bg-slate-50 text-[11px] text-slate-600 shadow-2xs">
                  <tr className="border-b border-slate-200">
                    <th className="px-3 py-1.5 font-semibold">Nama & Email</th>
                    <th className="px-2.5 py-1.5 font-semibold">Role</th>
                    <th className="px-2.5 py-1.5 font-semibold">Divisi</th>
                    <th className="px-2.5 py-1.5 font-semibold">Kuota</th>
                    <th className="px-3 py-1.5 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList.map((u) => (
                    <tr key={u.user_id} className="hover:bg-slate-50/80">
                      <td className="px-3 py-1.5">
                        <span className="font-semibold text-slate-800">
                          {u.nama}
                        </span>
                        <span className="block text-[11px] text-slate-500">
                          {u.email}
                        </span>
                      </td>
                      <td className="px-2.5 py-1.5">
                        <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[#007bff]">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-2.5 py-1.5 text-slate-700">
                        {u.nama_divisi || "-"}
                      </td>
                      <td className="px-2.5 py-1.5 font-medium text-slate-800">
                        {u.lama_waktu_cuti}
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        {u.user_id !== user.user_id && (
                          <button
                            type="button"
                            onClick={() => handleDelete("user", u.user_id)}
                            className="rounded bg-[#dc3545] px-2 py-0.5 text-[11px] font-semibold text-white transition hover:bg-red-700"
                          >
                            Hapus
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* COMPACT DIVISION MANAGEMENT */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <form
            onSubmit={handleCreateDivisi}
            className="overflow-hidden rounded border border-slate-200 bg-white shadow-2xs lg:col-span-5"
          >
            <div className="border-b border-slate-200 bg-slate-50 px-3.5 py-2">
              <h2 className="text-xs font-semibold text-slate-800">
                Tambah Divisi
              </h2>
            </div>
            <div className="space-y-2.5 p-3.5 text-xs">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                    Nama Divisi
                  </label>
                  <input
                    value={namaDivisi}
                    onChange={(e) => setNamaDivisi(e.target.value)}
                    required
                    className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#007bff] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                    Deskripsi
                  </label>
                  <input
                    value={deskripsiDivisi}
                    onChange={(e) => setDeskripsiDivisi(e.target.value)}
                    className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#007bff] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2.5 pt-0.5 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                    Ketua Divisi
                  </label>
                  <select
                    value={ketuaId}
                    onChange={(e) => setKetuaId(e.target.value)}
                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#007bff] focus:outline-none"
                  >
                    <option value="">-- Belum Ditentukan --</option>
                    {usersList.map((u) => (
                      <option key={u.user_id} value={u.user_id}>
                        {u.nama} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="shrink-0 rounded bg-[#007bff] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-600"
                >
                  Simpan Divisi
                </button>
              </div>
            </div>
          </form>

          <div className="overflow-hidden rounded border border-slate-200 bg-white shadow-2xs lg:col-span-7">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3.5 py-2">
              <h3 className="text-xs font-semibold text-slate-800">
                Daftar Divisi
              </h3>
              <span className="rounded bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                {divisiList.length}
              </span>
            </div>
            <div className="max-h-56 overflow-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="sticky top-0 bg-slate-50 text-[11px] text-slate-600 shadow-2xs">
                  <tr className="border-b border-slate-200">
                    <th className="px-3 py-1.5 font-semibold">Nama Divisi</th>
                    <th className="px-2.5 py-1.5 font-semibold">Ketua</th>
                    <th className="px-2.5 py-1.5 font-semibold">Anggota</th>
                    <th className="px-3 py-1.5 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {divisiList.map((d) => (
                    <tr key={d.divisi_id} className="hover:bg-slate-50/80">
                      <td className="px-3 py-1.5 font-semibold text-slate-800">
                        {d.nama_divisi}
                      </td>
                      <td className="px-2.5 py-1.5 text-slate-700">
                        {d.ketua_nama || "-"}
                      </td>
                      <td className="px-2.5 py-1.5 text-slate-700">
                        {d.jumlah_anggota}
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete("divisi", d.divisi_id)}
                          className="rounded bg-[#dc3545] px-2 py-0.5 text-[11px] font-semibold text-white transition hover:bg-red-700"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}