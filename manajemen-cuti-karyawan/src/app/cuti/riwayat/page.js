"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function RiwayatCutiPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
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

  async function handleCancel(cutiId) {
    setPesan("");
    const res = await fetch("/api/cuti/riwayat", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cuti_id: cutiId,
        userId: user.user_id,
        alasan_batal: "Dibatalkan pengguna",
      }),
    });

    const data = await res.json();
    setPesan(data.message || "");
    if (res.ok) {
      await loadHistory(user);
    }
  }

  if (loading) return <p>Memuat riwayat cuti...</p>;
  if (!user) return null;

  return (
    <div>
      <h1>Riwayat Pengajuan Cuti</h1>
      {pesan && <p>{pesan}</p>}

      {history.length === 0 ? (
        <p>Belum ada riwayat pengajuan cuti.</p>
      ) : (
        history.map((item) => (
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
            {(item.status === "Pending" || !item.status) && (
              <button type="button" onClick={() => handleCancel(item.cuti_id)}>
                Batalkan Pengajuan
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}