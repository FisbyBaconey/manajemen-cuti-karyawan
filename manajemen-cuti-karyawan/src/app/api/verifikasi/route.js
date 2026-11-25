import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(request) {
  try {
    const { role, userId } = await request.json();

    if (!role || !userId) {
      return NextResponse.json(
        { message: "Role dan userId wajib diisi" },
        { status: 400 }
      );
    }

    if (role === "ketdiv") {
      const result = await pool.query(
        `SELECT c.*,
                u.nama,
                u.foto_profil,
                u.divisi_id,
                r.nama
         FROM cuti c
         JOIN users u ON c.user_id = u.user_id
         LEFT JOIN users r ON c.rekan_id = r.user_id
         WHERE u.divisi_id = (SELECT divisi_id FROM users WHERE user_id = $1) AND c.user_id <> $1
         ORDER BY c.tanggal_pengajuan DESC`,
        [userId]
      );

      return NextResponse.json({ requests: result.rows });
    }

    if (role === "hrd") {
      const result = await pool.query(
        `SELECT c.*,
                u.nama AS pemohon_nama,
                u.foto_profil AS pemohon_foto,
                u.divisi_id,
                d.nama_divisi,
                r.nama AS rekan_nama
         FROM cuti c
         JOIN users u ON c.user_id = u.user_id
         LEFT JOIN divisi d ON u.divisi_id = d.divisi_id
         LEFT JOIN users r ON c.rekan_id = r.user_id
         ORDER BY c.tanggal_pengajuan DESC`
      );

      return NextResponse.json({ requests: result.rows });
    }

    return NextResponse.json(
      { message: "Role tidak memiliki akses verifikasi/persetujuan" },
      { status: 403 }
    );
  } catch (error) {
    console.error("POST /api/cuti/verifikasi error:", error);
    return NextResponse.json(
      { message: "Gagal memuat daftar pengajuan cuti", detail: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const { cuti_id, role, action, catatan } = await request.json();

    if (!cuti_id || !role || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { message: "Data aksi tidak valid" },
        { status: 400 }
      );
    }

    if (action === "reject" && (!catatan || !catatan.trim())) {
      return NextResponse.json(
        { message: "Catatan penolakan wajib diisi" },
        { status: 400 }
      );
    }

    const cutiRes = await pool.query(
      "SELECT * FROM cuti WHERE cuti_id = $1",
      [cuti_id]
    );

    if (cutiRes.rows.length === 0) {
      return NextResponse.json(
        { message: "Data cuti tidak ditemukan" },
        { status: 404 }
      );
    }

    const currentCuti = cutiRes.rows[0];
    let nextStatus = currentCuti.status;

    if (role === "ketdiv") {
      nextStatus = action === "approve" ? "Approved by Leader" : "Rejected";
      await pool.query(
        `UPDATE cuti
         SET status = $1, catatan_ketdiv = $2
         WHERE cuti_id = $3`,
        [nextStatus, catatan || null, cuti_id]
      );
    } else if (role === "hrd") {
      nextStatus = action === "approve" ? "Approved" : "Rejected";
      await pool.query(
        `UPDATE cuti
         SET status = $1, catatan_hrd = $2
         WHERE cuti_id = $3`,
        [nextStatus, catatan || null, cuti_id]
      );
    } else {
      return NextResponse.json(
        { message: "Role tidak diizinkan melakukan aksi ini" },
        { status: 403 }
      );
    }

    // Refund annual leave quota if rejected
    if (
      action === "reject" &&
      currentCuti.status !== "Rejected" &&
      currentCuti.jenis_cuti === "Cuti Tahunan"
    ) {
      const start = new Date(currentCuti.mulai_cuti);
      const end = new Date(currentCuti.selesai_cuti);
      const days = Math.max(
        1,
        Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      );

      await pool.query(
        "UPDATE users SET lama_waktu_cuti = lama_waktu_cuti + $1 WHERE user_id = $2",
        [days, currentCuti.user_id]
      );
    }

    return NextResponse.json({
      message:
        action === "approve"
          ? `Pengajuan berhasil di-approve (${nextStatus})`
          : "Pengajuan berhasil ditolak",
      status: nextStatus,
    });
  } catch (error) {
    console.error("PATCH /api/cuti/verifikasi error:", error);
    return NextResponse.json(
      { message: "Gagal memperbarui status cuti", detail: error.message },
      { status: 500 }
    );
  }
}