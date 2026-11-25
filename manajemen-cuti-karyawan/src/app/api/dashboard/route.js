import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(request) {
  try {
    const { role, userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { message: "userId tidak ditemukan" },
        { status: 400 }
      );
    }

    if (role === "admin") {
      const totalUsersRes = await pool.query("SELECT COUNT(*) AS total FROM users");
      const activeUsersRes = await pool.query(
        "SELECT COUNT(*) AS total FROM users WHERE aktif = TRUE"
      );
      const totalDivisiRes = await pool.query("SELECT COUNT(*) AS total FROM divisi");
      const juniorUsersRes = await pool.query(
        "SELECT user_id, nama, masa_kerja FROM users WHERE masa_kerja < 1"
      );

      return NextResponse.json({
        totalUsers: Number(totalUsersRes.rows[0].total),
        activeUsers: Number(activeUsersRes.rows[0].total),
        totalDivisi: Number(totalDivisiRes.rows[0].total),
        juniorUsers: juniorUsersRes.rows,
      });
    }

    if (role === "hrd") {
      const divisiRes = await pool.query("SELECT * FROM divisi ORDER BY nama_divisi ASC");
      const cutiBulanIniRes = await pool.query(
        `SELECT COUNT(*) AS total
         FROM cuti
         WHERE DATE_TRUNC('month', tanggal_pengajuan) = DATE_TRUNC('month', CURRENT_DATE)`
      );

      return NextResponse.json({
        divisiList: divisiRes.rows,
        totalCutiBulanIni: Number(cutiBulanIniRes.rows[0].total),
      });
    }

    if (role === "ketdiv") {
      const cutiRes = await pool.query(
        `SELECT c.*, u.nama
         FROM cuti c
         JOIN users u ON c.user_id = u.user_id
         WHERE u.divisi_id = (SELECT divisi_id FROM users WHERE user_id = $1)`,
        [userId]
      );

      return NextResponse.json({
        teamCuti: cutiRes.rows,
      });
    }

    const userRes = await pool.query(
      `SELECT u.nama, u.lama_waktu_cuti, d.nama_divisi
       FROM users u
       LEFT JOIN divisi d ON u.divisi_id = d.divisi_id
       WHERE u.user_id = $1`,
      [userId]
    );

    const sakitCountRes = await pool.query(
      `SELECT COUNT(*) AS total
       FROM cuti
       WHERE user_id = $1 AND jenis_cuti ILIKE '%sakit%'`,
      [userId]
    );

    return NextResponse.json({
      profile: userRes.rows[0] || null,
      jumlahCutiSakit: Number(sakitCountRes.rows[0].total),
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { message: "Gagal memuat dashboard", detail: error.message },
      { status: 500 }
    );
  }
}