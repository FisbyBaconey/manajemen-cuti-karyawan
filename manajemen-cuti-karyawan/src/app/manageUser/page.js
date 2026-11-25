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

  if (loading) return <p>Memuat panel admin...</p>;
  if (!user) return null;

  return (
    <div>
      <PendingList/>
      <h1>Panel Admin</h1>
      {pesan && <p>{pesan}</p>}

      <hr />
      <h2>Tambah Pengguna</h2>
      <form onSubmit={handleCreateUser}>
        <div>
          <label>Nama Lengkap</label>
          <input value={nama} onChange={(e) => setNama(e.target.value)} required />
        </div>
        <div>
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div>
          <label>Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="user">user</option>
            <option value="ketdiv">ketdiv</option>
            <option value="hrd">hrd</option>
            <option value="admin">admin</option>
          </select>
        </div>
        <div>
          <label>Divisi</label>
          <select value={divisiId} onChange={(e) => setDivisiId(e.target.value)}>
            {divisiList.map((d) => (
              <option key={d.divisi_id} value={d.divisi_id}>
                {d.nama_divisi}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Kuota Cuti Awal</label>
          <input
            type="number"
            value={kuotaAwal}
            onChange={(e) => setKuotaAwal(e.target.value)}
            required
          />
        </div>
        <button type="submit">Simpan Pengguna</button>
      </form>

      <h3>Daftar Pengguna ({usersList.length})</h3>
      <ul>
        {usersList.map((u) => (
          <li key={u.user_id}>
            {u.nama} ({u.email}) — Role: {u.role} — Divisi: {u.nama_divisi || "-"} — Kuota: {u.lama_waktu_cuti}{" "}
            {u.user_id !== user.user_id && (
              <button type="button" onClick={() => handleDelete("user", u.user_id)}>
                Hapus
              </button>
            )}
          </li>
        ))}
      </ul>

      <hr />
      <h2>Tambah Divisi</h2>
      <form onSubmit={handleCreateDivisi}>
        <div>
          <label>Nama Divisi</label>
          <input
            value={namaDivisi}
            onChange={(e) => setNamaDivisi(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Deskripsi</label>
          <input
            value={deskripsiDivisi}
            onChange={(e) => setDeskripsiDivisi(e.target.value)}
          />
        </div>
        <div>
          <label>Ketua Divisi</label>
          <select value={ketuaId} onChange={(e) => setKetuaId(e.target.value)}>
            <option value="">-- Belum Ditentukan --</option>
            {usersList.map((u) => (
              <option key={u.user_id} value={u.user_id}>
                {u.nama} ({u.role})
              </option>
            ))}
          </select>
        </div>
        <button type="submit">Simpan Divisi</button>
      </form>

      <h3>Daftar Divisi ({divisiList.length})</h3>
      <ul>
        {divisiList.map((d) => (
          <li key={d.divisi_id}>
            {d.nama_divisi} — Ketua: {d.ketua_nama || "-"} — Anggota: {d.jumlah_anggota}{" "}
            <button type="button" onClick={() => handleDelete("divisi", d.divisi_id)}>
              Hapus
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}