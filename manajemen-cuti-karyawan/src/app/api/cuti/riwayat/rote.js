import { NextResponse } from "next/server";
import pool from "@/lib/db";

function countWorkingDaysOnly(startDate, endDate) {
  let days = 0;
  const cursor = new Date(startDate);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (cursor <= end) {
    const d = cursor.getDay();
    if (d !== 0 && d !== 6) days += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return Math.max(1, days);
}

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
      `SELECT c.*,
              r.nama AS rekan_nama,
              d.nama_divisi,
              k.nama AS ketua_nama
       FROM cuti c
       JOIN users u ON c.user_id = u.user_id
       LEFT JOIN divisi d ON u.divisi_id = d.divisi_id
       LEFT JOIN users k ON d.ketua_divisi_id = k.user_id
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

    if (!alasan_batal || !alasan_batal.trim()) {
      return NextResponse.json(
        { message: "Alasan pembatalan wajib diisi" },
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
       SET status = 'Cancelled', catatan_hrd = $1
       WHERE cuti_id = $2`,
      [`Dibatalkan oleh pemohon: ${alasan_batal.trim()}`, cuti_id]
    );

    if (item.jenis_cuti === "Cuti Tahunan") {
      const days = countWorkingDaysOnly(item.mulai_cuti, item.selesai_cuti);
      await pool.query(
        "UPDATE users SET lama_waktu_cuti = lama_waktu_cuti + $1 WHERE user_id = $2",
        [days, userId]
      );
    }

    return NextResponse.json({
      message: "Pengajuan cuti dibatalkan dan kuota dikembalikan",
    });
  } catch (error) {
    console.error("PATCH /api/cuti/riwayat error:", error);
    return NextResponse.json(
      { message: "Gagal membatalkan cuti", detail: error.message },
      { status: 500 }
    );
  }
}