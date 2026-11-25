# E-Cuti Hasan Office — Sistem Manajemen Pengajuan & Persetujuan Cuti

Aplikasi web berbasis **Next.js (App Router)** dan **Tailwind CSS** untuk mengelola pengajuan cuti karyawan, serah terima tugas (*handover*), serta alur persetujuan berjenjang (**Staff → Ketua Divisi → HRD**) dan manajemen pengguna/divisi oleh **Admin**.

---

## Fitur Utama

### 1. Autentikasi & Manajemen Akun
* **Login & Registrasi Staff:** Pengguna baru dapat mendaftar melalui halaman registrasi (`/signin`) dan menunggu aktivasi dari Admin sebelum dapat masuk ke sistem.
* **Kontrol Akses Berbasis Role (*Role-Based Access Control*):**
  * `user` (Staff)
  * `ketdiv` (Ketua Divisi)
  * `hrd` (Human Resources Department)
  * `admin` (Administrator)
* **Konfirmasi Logout:** Komponen *double-check* sebelum mengakhiri sesi pengguna.

### 2. Pengajuan & Riwayat Cuti (Staff)
* **Form Pengajuan Cuti (`/cuti/ajukan`):**
  * Pilihan jenis cuti (*Cuti Tahunan*, *Cuti Sakit*, *Cuti Lainnya*) dan opsi **Cuti Setengah Hari (0.5 hari)**.
  * Perhitungan otomatis jumlah hari kerja (mengecualikan akhir pekan).
  * Penunjukan **Rekan Pengganti (*Handover*)** beserta catatan tugas, alamat selama cuti, nomor darurat, dan lampiran surat dokter (wajib untuk *Cuti Sakit*).
* **Riwayat Pengajuan Cuti (`/cuti/riwayat`):**
  * Filter status pengajuan (`ALL`, `Pending`, `Approved by Leader`, `Approved`, `Rejected`, `Cancelled`).
  * Detail lengkap *handover* serta **Timeline Approval** real-time.
  * Pembatalan pengajuan berstatus `Pending` dengan alasan pembatalan.

### 3. Persetujuan Berjenjang (Ketua Divisi & HRD)
* **Verifikasi Ketua Divisi (`/cuti/verifikasi`):** Meninjau pengajuan cuti anggota divisi dan memberikan keputusan *Approve* atau *Reject* (wajib disertai catatan penolakan).
* **Persetujuan Final HRD (`/cuti/persetujuanFinal`):** Validasi akhir pengajuan cuti yang telah diverifikasi oleh Ketua Divisi.

### 4. Dashboard & Panel Admin
* **Dashboard Dinamis (`/dashboard`):** Menampilkan ringkasan metrik sesuai role (sisa kuota cuti, karyawan yang sedang cuti, daftar anggota divisi, pengajuan pending, dan karyawan dengan masa kerja < 1 tahun).
* **Panel Admin (`/manageUser`):**
  * Persetujuan atau penolakan akun staff baru yang mendaftar (*Pending Approvals*).
  * Tambah dan hapus data pengguna serta pengaturan kuota cuti awal.
  * Tambah dan hapus divisi beserta penunjukan Ketua Divisi.
* **Profil Pengguna (`/profil`):** Melihat sisa kuota cuti tahunan serta memperbarui informasi pribadi dan kata sandi.

---

## Tech Stack

* **Framework:** Next.js (App Router)
* **UI & Styling:** React, Tailwind CSS
* **Backend:** Next.js API Routes (`/api/...`)
* **State & Session:** React Hooks (`useState`, `useEffect`, `useMemo`) & `localStorage`

---

## Struktur Halaman & API Utama

```text
├── app/
│   ├── page.js                    # Halaman Login
│   ├── signin/page.js             # Halaman Registrasi Akun Staff
│   ├── dashboard/page.js          # Dashboard Utama (Multi-Role)
│   ├── profil/page.js             # Profil Pengguna & Info Kuota Cuti
│   ├── manageUser/page.js         # Panel Admin (User, Divisi, Approval Akun)
│   ├── cuti/
│   │   ├── ajukan/page.js         # Form Pengajuan Cuti
│   │   ├── riwayat/page.js        # Riwayat & Timeline Pengajuan Cuti
│   │   ├── verifikasi/page.js     # Verifikasi Cuti (Ketua Divisi)
│   │   └── persetujuanFinal/      # Persetujuan Final Cuti (HRD)
│   └── api/                       # Endpoint Backend (auth, cuti, dashboard, profil, manageUser)
└── components/
    ├── logOut.js                  # Tombol & Modal Konfirmasi Logout
    └── pendingList.js             # Daftar Akun Menunggu Persetujuan Admin
```

---

## Alur Status Pengajuan Cuti

1. `Pending` — Pengajuan baru dikirim oleh Staff, menunggu verifikasi Ketua Divisi.
2. `Approved by Leader` — Disetujui oleh Ketua Divisi, diteruskan ke HRD.
3. `Approved` — Disetujui secara final oleh HRD dan kuota cuti terpotong.
4. `Rejected` — Ditolak oleh Ketua Divisi atau HRD disertai catatan alasan.
5. `Cancelled` — Dibatalkan oleh pemohon sebelum diproses.