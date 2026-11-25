import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const usersRes = await pool.query(
      `SELECT u.user_id, u.nama, u.email, u.role, u.aktif, u.masa_kerja,
              u.lama_waktu_cuti, u.divisi_id, d.nama_divisi
       FROM users u
       LEFT JOIN divisi d ON u.divisi_id = d.divisi_id
       ORDER BY u.user_id ASC`
    );

    const divisiRes = await pool.query(
      `SELECT d.divisi_id, d.nama_divisi, d.deskripsi_divisi, d.ketua_divisi_id,
              d.tanggal_dibentuk, k.nama AS ketua_nama,
              COUNT(u.user_id) AS jumlah_anggota
       FROM divisi d
       LEFT JOIN users k ON d.ketua_divisi_id = k.user_id
       LEFT JOIN users u ON u.divisi_id = d.divisi_id
       GROUP BY d.divisi_id, k.nama
       ORDER BY d.divisi_id ASC`
    );

    return NextResponse.json({
      users: usersRes.rows,
      divisiList: divisiRes.rows,
    });
  } catch (error) {
    console.error("GET /api/manageUser error:", error);
    return NextResponse.json(
      { message: "Gagal memuat data admin", detail: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    if (body.type === "user") {
      const { nama, email, password, role, divisi_id, lama_waktu_cuti } = body;

      if (!nama || !email || !password || !role) {
        return NextResponse.json(
          { message: "Nama, email, password, dan role wajib diisi" },
          { status: 400 }
        );
      }

      const res = await pool.query(
        `INSERT INTO users (nama, email, password, role, aktif, divisi_id, lama_waktu_cuti)
         VALUES ($1, $2, $3, $4, TRUE, $5, $6)
         RETURNING user_id, nama, email, role, aktif, divisi_id, lama_waktu_cuti`,
        [
          nama,
          email,
          password,
          role,
          divisi_id ? Number(divisi_id) : 1,
          Number(lama_waktu_cuti ?? 12),
        ]
      );

      return NextResponse.json(
        { message: "Pengguna berhasil ditambahkan", user: res.rows[0] },
        { status: 201 }
      );
    }

    if (body.type === "divisi") {
      const { nama_divisi, deskripsi_divisi, ketua_divisi_id } = body;

      if (!nama_divisi || !nama_divisi.trim()) {
        return NextResponse.json(
          { message: "Nama divisi wajib diisi" },
          { status: 400 }
        );
      }

      const res = await pool.query(
        `INSERT INTO divisi (nama_divisi, deskripsi_divisi, ketua_divisi_id)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [
          nama_divisi.trim(),
          deskripsi_divisi || null,
          ketua_divisi_id ? Number(ketua_divisi_id) : null,
        ]
      );

      return NextResponse.json(
        { message: "Divisi berhasil ditambahkan", divisi: res.rows[0] },
        { status: 201 }
      );
    }

    return NextResponse.json({ message: "Tipe aksi tidak dikenali" }, { status: 400 });
  } catch (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { message: "Data duplikat (nama/email/ketua divisi sudah terpakai)" },
        { status: 409 }
      );
    }

    console.error("POST /api/manageUser error:", error);
    return NextResponse.json(
      { message: "Gagal menyimpan data admin", detail: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { type, id } = await request.json();

    if (!type || !id) {
      return NextResponse.json(
        { message: "Tipe dan id wajib diisi" },
        { status: 400 }
      );
    }

    if (type === "user") {
      await pool.query("DELETE FROM users WHERE user_id = $1", [Number(id)]);
      return NextResponse.json({ message: "Pengguna berhasil dihapus" });
    }

    if (type === "divisi") {
      await pool.query("DELETE FROM divisi WHERE divisi_id = $1", [Number(id)]);
      return NextResponse.json({ message: "Divisi berhasil dihapus" });
    }

    return NextResponse.json({ message: "Tipe aksi tidak dikenali" }, { status: 400 });
  } catch (error) {
    console.error("DELETE /api/manageUser error:", error);
    return NextResponse.json(
      { message: "Gagal menghapus data", detail: error.message },
      { status: 500 }
    );
  }
}