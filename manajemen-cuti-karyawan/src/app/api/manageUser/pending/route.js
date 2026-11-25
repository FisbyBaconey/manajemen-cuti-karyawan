import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const res = await pool.query(
      `SELECT u.user_id,
              u.nama,
              u.username,
              u.email,
              u.role,
              u.divisi_id,
              d.nama_divisi,
              u.lama_waktu_cuti,
              u.masa_kerja,
              u.aktif
       FROM users u
       LEFT JOIN divisi d ON u.divisi_id = d.divisi_id
       WHERE u.aktif = FALSE
       ORDER BY u.user_id DESC`
    );

    return NextResponse.json({ pendingUsers: res.rows });
  } catch (error) {
    console.error("GET /api/manageUser/pending error:", error);
    return NextResponse.json(
      { message: "Gagal memuat daftar akun menunggu persetujuan", detail: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const { user_id, action, divisi_id, role } = await request.json();

    if (!user_id || action !== "accept") {
      return NextResponse.json(
        { message: "Data aksi tidak valid" },
        { status: 400 }
      );
    }

    const res = await pool.query(
      `UPDATE users
       SET aktif = TRUE,
           divisi_id = COALESCE($2, divisi_id),
           role = COALESCE($3, role)
       WHERE user_id = $1
       RETURNING user_id, nama, email, role, aktif`,
      [Number(user_id), divisi_id ?? null, role ?? null]
    );

    if (res.rows.length === 0) {
      return NextResponse.json(
        { message: "Akun tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: `Akun ${res.rows[0].nama} berhasil diterima dan diaktifkan`,
      user: res.rows[0],
    });
  } catch (error) {
    console.error("PATCH /api/manageUser/pending error:", error);
    return NextResponse.json(
      { message: "Gagal menerima akun", detail: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { user_id } = await request.json();

    if (!user_id) {
      return NextResponse.json(
        { message: "user_id wajib diisi" },
        { status: 400 }
      );
    }

    const res = await pool.query(
      "DELETE FROM users WHERE user_id = $1 AND aktif = FALSE RETURNING user_id, nama",
      [Number(user_id)]
    );

    if (res.rows.length === 0) {
      return NextResponse.json(
        { message: "Akun pending tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: `Pendaftaran akun ${res.rows[0].nama} telah ditolak dan dihapus`,
    });
  } catch (error) {
    console.error("DELETE /api/manageUser/pending error:", error);
    return NextResponse.json(
      { message: "Gagal menolak akun", detail: error.message },
      { status: 500 }
    );
  }
}