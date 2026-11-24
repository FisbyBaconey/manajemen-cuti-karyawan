import { NextResponse } from "next/server";
import pool from "@/lib/db";

// Load profile data
export async function POST(request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { message: "userId tidak ditemukan" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `SELECT u.user_id, u.nama, u.email, u.foto_profil, u.telepon, u.alamat,
              u.role, u.aktif, u.masa_kerja, u.lama_waktu_cuti, d.nama_divisi
       FROM users u
       LEFT JOIN divisi d ON u.divisi_id = d.divisi_id
       WHERE u.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: "Pengguna tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ profile: result.rows[0] });
  } catch (error) {
    console.error("Profil GET/POST error:", error);
    return NextResponse.json(
      { message: "Gagal memuat profil", detail: error.message },
      { status: 500 }
    );
  }
}

// Update profile data
export async function PUT(request) {
  try {
    const { userId, nama, email, telepon, alamat, foto_profil, password } =
      await request.json();

    if (!userId || !nama || !email) {
      return NextResponse.json(
        { message: "Nama dan email wajib diisi" },
        { status: 400 }
      );
    }

    let result;
    if (password && password.trim() !== "") {
      result = await pool.query(
        `UPDATE users
         SET nama = $1, email = $2, telepon = $3, alamat = $4, foto_profil = $5, password = $6
         WHERE user_id = $7
         RETURNING user_id, nama, email, foto_profil, telepon, alamat, role, aktif, masa_kerja, lama_waktu_cuti, divisi_id`,
        [nama, email, telepon || null, alamat || null, foto_profil || null, password, userId]
      );
    } else {
      result = await pool.query(
        `UPDATE users
         SET nama = $1, email = $2, telepon = $3, alamat = $4, foto_profil = $5
         WHERE user_id = $6
         RETURNING user_id, nama, email, foto_profil, telepon, alamat, role, aktif, masa_kerja, lama_waktu_cuti, divisi_id`,
        [nama, email, telepon || null, alamat || null, foto_profil || null, userId]
      );
    }

    return NextResponse.json({
      message: "Profil berhasil diperbarui",
      profile: result.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { message: "Nama atau email sudah digunakan pengguna lain" },
        { status: 409 }
      );
    }

    console.error("Profil PUT error:", error);
    return NextResponse.json(
      { message: "Gagal memperbarui profil", detail: error.message },
      { status: 500 }
    );
  }
}