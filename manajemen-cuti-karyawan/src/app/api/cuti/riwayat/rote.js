import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { message: "userId wajib diisi" },
        { status: 400 }
      );
    }

    const res = await pool.query(
      `SELECT c.*, r.nama AS rekan_nama
       FROM cuti c
       LEFT JOIN users r ON c.rekan_id = r.user_id
       WHERE c.user_id = $1
       ORDER BY c.tanggal_pengajuan DESC`,
      [userId]
    );

    return NextResponse.json({ history: res.rows });
  } catch (error) {
    console.error("POST /api/cuti/riwayat error:", error);
    return NextResponse.json(
      { message: "Gagal memuat riwayat cuti", detail: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const { cuti_id, userId, alasan_batal } = await request.json();

    if (!cuti_id || !userId) {
      return NextResponse.json(
        { message: "cuti_id dan userId wajib diisi" },
        { status: 400 }
      );
    }

    const cutiRes = await pool.query(
      "SELECT * FROM cuti WHERE cuti_id = $1 AND user_id = $2",
      [cuti_id, userId]
    );

    if (cutiRes.rows.length === 0) {
      return NextResponse.json(
        { message: "Pengajuan cuti tidak ditemukan" },
        { status: 404 }
      );
    }

    const item = cutiRes.rows[0];
    if (item.status && item.status !== "Pending") {
      return NextResponse.json(
        { message: "Hanya pengajuan berstatus Pending yang bisa dibatalkan" },
        { status: 400 }
      );
    }

    await pool.query(
      `UPDATE cuti
       SET status = 'Cancelled', catatan_hrd = COALESCE($1, catatan_hrd)
       WHERE cuti_id = $2`,
      [alasan_batal ? `Dibatalkan: ${alasan_batal}` : "Dibatalkan oleh pemohon", cuti_id]
    );

    if (item.jenis_cuti === "Cuti Tahunan") {
      const start = new Date(item.mulai_cuti);
      const end = new Date(item.selesai_cuti);
      const days = Math.max(
        1,
        Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      );

      await pool.query(
        "UPDATE users SET lama_waktu_cuti = lama_waktu_cuti + $1 WHERE user_id = $2",
        [days, userId]
      );
    }

    return NextResponse.json({ message: "Pengajuan cuti dibatalkan dan kuota dikembalikan" });
  } catch (error) {
    console.error("PATCH /api/cuti/riwayat error:", error);
    return NextResponse.json(
      { message: "Gagal membatalkan cuti", detail: error.message },
      { status: 500 }
    );
  }
}