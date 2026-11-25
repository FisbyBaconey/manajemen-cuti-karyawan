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
      const [
        totalUsersRes,
        activeUsersRes,
        inactiveUsersRes,
        totalDivisiRes,
        cutiBulanIniRes,
        pendingApprovalRes,
        juniorUsersRes,
      ] = await Promise.all([
        pool.query("SELECT COUNT(*) AS total FROM users"),
        pool.query("SELECT COUNT(*) AS total FROM users WHERE aktif = TRUE"),
        pool.query("SELECT COUNT(*) AS total FROM users WHERE aktif = FALSE"),
        pool.query("SELECT COUNT(*) AS total FROM divisi"),
        pool.query(
          `SELECT COUNT(*) AS total
           FROM cuti
           WHERE DATE_TRUNC('month', tanggal_pengajuan) = DATE_TRUNC('month', CURRENT_DATE)`
        ),
        pool.query(
          `SELECT COUNT(*) AS total
           FROM cuti
           WHERE status IN ('Pending', 'Approved by Leader')`
        ),
        pool.query(
          "SELECT user_id, nama, masa_kerja FROM users WHERE masa_kerja < 1 ORDER BY nama ASC"
        ),
      ]);

      return NextResponse.json({
        totalUsers: Number(totalUsersRes.rows[0].total),
        activeUsers: Number(activeUsersRes.rows[0].total),
        inactiveUsers: Number(inactiveUsersRes.rows[0].total),
        totalDivisi: Number(totalDivisiRes.rows[0].total),
        totalCutiBulanIni: Number(cutiBulanIniRes.rows[0].total),
        pendingApproval: Number(pendingApprovalRes.rows[0].total),
        juniorUsers: juniorUsersRes.rows,
      });
    }

    if (role === "hrd") {
      const [
        divisiRes,
        cutiBulanIniRes,
        pendingFinalRes,
        sedangCutiBulanIniRes,
      ] = await Promise.all([
        pool.query(
          `SELECT d.*, k.nama AS ketua_nama, COUNT(u.user_id) AS jumlah_anggota
           FROM divisi d
           LEFT JOIN users k ON d.ketua_divisi_id = k.user_id
           LEFT JOIN users u ON u.divisi_id = d.divisi_id
           GROUP BY d.divisi_id, k.nama
           ORDER BY d.nama_divisi ASC`
        ),
        pool.query(
          `SELECT COUNT(*) AS total
           FROM cuti
           WHERE DATE_TRUNC('month', tanggal_pengajuan) = DATE_TRUNC('month', CURRENT_DATE)`
        ),
        pool.query(
          `SELECT COUNT(*) AS total
           FROM cuti
           WHERE status IN ('Pending', 'Approved by Leader')`
        ),
        pool.query(
          `SELECT c.cuti_id, u.nama, d.nama_divisi, c.jenis_cuti, c.mulai_cuti, c.selesai_cuti
           FROM cuti c
           JOIN users u ON c.user_id = u.user_id
           LEFT JOIN divisi d ON u.divisi_id = d.divisi_id
           WHERE c.status = 'Approved'
             AND c.mulai_cuti <= (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')
             AND c.selesai_cuti >= DATE_TRUNC('month', CURRENT_DATE)
           ORDER BY c.mulai_cuti ASC`
        ),
      ]);

      return NextResponse.json({
        divisiList: divisiRes.rows,
        totalCutiBulanIni: Number(cutiBulanIniRes.rows[0].total),
        pendingFinalApproval: Number(pendingFinalRes.rows[0].total),
        sedangCutiBulanIni: sedangCutiBulanIniRes.rows,
      });
    }

    if (role === "ketdiv") {
      const [teamCutiRes, anggotaDivisiRes, cutiMingguIniRes] = await Promise.all([
        pool.query(
          `SELECT c.*, u.nama
           FROM cuti c
           JOIN users u ON c.user_id = u.user_id
           WHERE u.divisi_id = (SELECT divisi_id FROM users WHERE user_id = $1)
             AND c.user_id <> $1`,
          [userId]
        ),
        pool.query(
          `SELECT user_id, nama, email, role, aktif
           FROM users
           WHERE divisi_id = (SELECT divisi_id FROM users WHERE user_id = $1)
           ORDER BY nama ASC`,
          [userId]
        ),
        pool.query(
          `SELECT c.cuti_id, u.nama, c.jenis_cuti, c.mulai_cuti, c.selesai_cuti, c.status
           FROM cuti c
           JOIN users u ON c.user_id = u.user_id
           WHERE u.divisi_id = (SELECT divisi_id FROM users WHERE user_id = $1)
             AND c.status IN ('Approved by Leader', 'Approved')
             AND c.mulai_cuti <= (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')
             AND c.selesai_cuti >= DATE_TRUNC('week', CURRENT_DATE)
           ORDER BY c.mulai_cuti ASC`,
          [userId]
        ),
      ]);

      const pendingVerifikasi = teamCutiRes.rows.filter(
        (item) => (item.status || "Pending") === "Pending"
      ).length;

      return NextResponse.json({
        teamCuti: teamCutiRes.rows,
        pendingVerifikasi,
        anggotaDivisi: anggotaDivisiRes.rows,
        cutiMingguIni: cutiMingguIniRes.rows,
      });
    }

    const [userRes, sakitCountRes, totalCutiRes] = await Promise.all([
      pool.query(
        `SELECT u.nama, u.lama_waktu_cuti, d.nama_divisi, k.nama AS ketua_nama
         FROM users u
         LEFT JOIN divisi d ON u.divisi_id = d.divisi_id
         LEFT JOIN users k ON d.ketua_divisi_id = k.user_id
         WHERE u.user_id = $1`,
        [userId]
      ),
      pool.query(
        `SELECT COUNT(*) AS total
         FROM cuti
         WHERE user_id = $1 AND jenis_cuti ILIKE '%sakit%'`,
        [userId]
      ),
      pool.query(
        `SELECT COUNT(*) AS total
         FROM cuti
         WHERE user_id = $1`,
        [userId]
      ),
    ]);

    return NextResponse.json({
      profile: userRes.rows[0] || null,
      jumlahCutiSakit: Number(sakitCountRes.rows[0].total),
      totalPengajuanCuti: Number(totalCutiRes.rows[0].total),
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { message: "Gagal memuat dashboard", detail: error.message },
      { status: 500 }
    );
  }
}