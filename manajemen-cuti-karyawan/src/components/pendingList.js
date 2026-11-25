"use client";

import { useEffect, useState } from "react";

export default function PendingList({ onUserApproved }) {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pesan, setPesan] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadPending() {
    try {
      const res = await fetch("/api/manageUser/pending");
      const data = await res.json();
      if (res.ok && Array.isArray(data.pendingUsers)) {
        setPendingUsers(data.pendingUsers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPending();
  }, []);

  async function handleAccept(userId) {
    setPesan("");
    try {
      const res = await fetch("/api/manageUser/pending", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, action: "accept" }),
      });
      const data = await res.json();
      setPesan(data.message || "");
      if (res.ok) {
        await loadPending();
        if (typeof onUserApproved === "function") {
          onUserApproved();
        }
      }
    } catch (err) {
      console.error(err);
      setPesan("Terjadi kesalahan saat menerima akun.");
    }
  }

  async function handleReject(userId) {
    setPesan("");
    try {
      const res = await fetch("/api/manageUser/pending", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();
      setPesan(data.message || "");
      if (res.ok) {
        await loadPending();
      }
    } catch (err) {
      console.error(err);
      setPesan("Terjadi kesalahan saat menolak akun.");
    }
  }

  if (loading) {
    return (
      <div className="mb-6 rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-xs">
        Memuat daftar akun menunggu persetujuan...
      </div>
    );
  }

  return (
    <section className="mb-6 overflow-hidden rounded-md border border-slate-200 bg-white shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/70 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">
          Akun Menunggu Persetujuan Admin
        </h2>
        <span className="inline-flex items-center rounded bg-amber-400 px-2.5 py-0.5 text-xs font-semibold text-slate-900">
          {pendingUsers.length} Menunggu
        </span>
      </div>

      <div className="p-4">
        {pesan && (
          <div className="mb-4 rounded border border-emerald-300 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-800">
            {pesan}
          </div>
        )}

        {pendingUsers.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">
            Tidak ada akun baru yang menunggu persetujuan.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                  <th className="px-3 py-2.5 font-semibold">Nama & Username</th>
                  <th className="px-3 py-2.5 font-semibold">Email</th>
                  <th className="px-3 py-2.5 font-semibold">Role</th>
                  <th className="px-3 py-2.5 font-semibold">Divisi</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pendingUsers.map((u) => (
                  <tr key={u.user_id} className="hover:bg-slate-50/70">
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-slate-800">{u.nama}</div>
                      <div className="text-xs text-slate-500">@{u.username}</div>
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">{u.email}</td>
                    <td className="px-3 py-2.5">
                      <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">
                      {u.nama_divisi || "Belum ditentukan"}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAccept(u.user_id)}
                          className="rounded bg-[#007bff] px-3 py-1 text-xs font-semibold text-white transition hover:bg-blue-600"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(u.user_id)}
                          className="rounded bg-[#dc3545] px-3 py-1 text-xs font-semibold text-white transition hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}