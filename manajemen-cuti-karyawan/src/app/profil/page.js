"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pesan, setPesan] = useState("");

  // Form states
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [telepon, setTelepon] = useState("");
  const [alamat, setAlamat] = useState("");
  const [fotoProfil, setFotoProfil] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (!saved || saved === "undefined") {
      router.replace("/");
      return;
    }

    let parsedUser;
    try {
      parsedUser = JSON.parse(saved);
    } catch {
      router.replace("/");
      return;
    }

    if (!parsedUser?.user_id) {
      router.replace("/");
      return;
    }

    async function fetchProfile() {
      try {
        const res = await fetch("/api/profil", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: parsedUser.user_id }),
        });

        const data = await res.json();
        if (res.ok && data.profile) {
          setProfile(data.profile);
          setNama(data.profile.nama || "");
          setEmail(data.profile.email || "");
          setTelepon(data.profile.telepon || "");
          setAlamat(data.profile.alamat || "");
          setFotoProfil(data.profile.foto_profil || "");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [router]);

  async function handleSave(e) {
    e.preventDefault();
    setPesan("");
    setSaving(true);

    try {
      const res = await fetch("/api/profil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: profile.user_id,
          nama,
          email,
          telepon,
          alamat,
          foto_profil: fotoProfil,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPesan(data.message || "Gagal memperbarui profil.");
        return;
      }

      setProfile((prev) => ({ ...prev, ...data.profile }));
      setPassword("");
      setEditing(false);
      setPesan("Profil berhasil diperbarui!");

      // Sync updated user info in localStorage
      const saved = localStorage.getItem("user");
      if (saved && saved !== "undefined") {
        const oldUser = JSON.parse(saved);
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...oldUser,
            nama: data.profile.nama,
            email: data.profile.email,
          })
        );
      }
    } catch (err) {
      console.error(err);
      setPesan("Terjadi kesalahan saat menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="p-6">Memuat profil...</p>;
  if (!profile) return <p className="p-6">Data profil tidak ditemukan.</p>;

  const kuotaAwal = 12;
  const sisaKuota = profile.lama_waktu_cuti ?? 12;
  const terpakai = Math.max(0, kuotaAwal - sisaKuota);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow mt-6">
      <div className="flex items-center gap-4 border-b pb-4">
        <img
          src={
            profile.foto_profil ||
            "https://ohmylens.com/wp-content/uploads/2017/06/dummy-profile-pic.png"
          }
          alt={profile.nama}
          className="w-20 h-20 rounded-full object-cover border"
        />
        <div>
          <h1 className="text-2xl font-bold">{profile.nama}</h1>
          <p className="text-sm text-gray-600 uppercase">
            Role: {profile.role} • Divisi: {profile.nama_divisi || "None"}
          </p>
          <p className="text-xs text-gray-500">
            Status: {profile.aktif ? "Aktif" : "Tidak Aktif"} • Masa Kerja: {profile.masa_kerja} tahun
          </p>
        </div>
      </div>

      {/* Informasi Kuota Cuti Tahunan */}
      <div className="grid grid-cols-3 gap-3 my-4 text-center bg-green-50 p-3 rounded border border-green-200">
        <div>
          <p className="text-xs text-gray-600">Kuota Tahunan</p>
          <p className="text-lg font-bold">{kuotaAwal} Hari</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Terpakai</p>
          <p className="text-lg font-bold text-amber-600">{terpakai} Hari</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Sisa Kuota</p>
          <p className="text-lg font-bold text-green-700">{sisaKuota} Hari</p>
        </div>
      </div>

      {pesan && <p className="mb-3 text-sm font-medium text-green-700">{pesan}</p>}

      {!editing ? (
        <div className="space-y-2 text-sm">
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Telepon:</strong> {profile.telepon || "-"}</p>
          <p><strong>Alamat:</strong> {profile.alamat || "-"}</p>

          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Edit Profil
          </button>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-3 text-sm">
          <div>
            <label className="block font-semibold">Nama Lengkap</label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
          </div>

          <div>
            <label className="block font-semibold">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
          </div>

          <div>
            <label className="block font-semibold">Telepon</label>
            <input
              type="text"
              value={telepon}
              onChange={(e) => setTelepon(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block font-semibold">Alamat</label>
            <textarea
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              className="w-full border p-2 rounded"
              rows={2}
            />
          </div>

          <div>
            <label className="block font-semibold">URL Foto Profil</label>
            <input
              type="text"
              value={fotoProfil}
              onChange={(e) => setFotoProfil(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block font-semibold">Password Baru (kosongkan jika tidak diubah)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Batal
            </button>
          </div>
        </form>
      )}
    </div>
  );
}