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

  if (loading) return <p>Memuat daftar akun menunggu persetujuan...</p>;

  return (
    <div>
      <h2>Akun Menunggu Persetujuan Admin ({pendingUsers.length})</h2>
      {pesan && <p>{pesan}</p>}

      {pendingUsers.length === 0 ? (
        <p>Tidak ada akun baru yang menunggu persetujuan.</p>
      ) : (
        <ul>
          {pendingUsers.map((u) => (
            <li key={u.user_id}>
              <strong>{u.nama}</strong> (@{u.username}) — {u.email} — Role: {u.role} —
              Divisi: {u.nama_divisi || "Belum ditentukan"}{" "}
              <button type="button" onClick={() => handleAccept(u.user_id)}>
                Accept
              </button>
              <button type="button" onClick={() => handleReject(u.user_id)}>
                Reject
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}