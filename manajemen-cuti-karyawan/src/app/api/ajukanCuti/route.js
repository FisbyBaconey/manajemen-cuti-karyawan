import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query(
      "SELECT user_id, nama, role FROM users ORDER BY nama ASC"
    );
    return NextResponse.json({ colleagues: result.rows });
  } catch (error) {
    console.error("GET colleagues error:", error);
    return NextResponse.json(
      { message: "Gagal memuat daftar rekan pengganti", detail: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const {
      userId,
      jenis_cuti,
      mulai_cuti,
      selesai_cuti,
      setengah_hari,
      jumlah_hari,
      alasan,
      rekan_id,
      catatan_tugas,
      alamat_cuti,
      nomor_darurat,
      surat_lampiran,
    } = await request.json();

    if (
      !userId ||
      !jenis_cuti ||
      !mulai_cuti ||
      !selesai_cuti ||
      !alasan ||
      !rekan_id ||
      !catatan_tugas ||
      !alamat_cuti ||
      !nomor_darurat
    ) {
      return NextResponse.json(
        { message: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    if (jenis_cuti === "Cuti Sakit" && !surat_lampiran) {
      return NextResponse.json(
        { message: "Cuti Sakit wajib melampirkan surat dokter / lampiran" },
        { status: 400 }
      );
    }

    const startDate = new Date(mulai_cuti);
    const endDate = new Date(selesai_cuti);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate < startDate) {
      return NextResponse.json(
        { message: "Rentang tanggal cuti tidak valid" },
        { status: 400 }
      );
    }

    const totalDays = Number(jumlah_hari) > 0 ? Number(jumlah_hari) : 1;

    const userRes = await pool.query(
      "SELECT user_id, lama_waktu_cuti FROM users WHERE user_id = $1",
      [userId]
    );

    if (userRes.rows.length === 0) {
      return NextResponse.json(
        { message: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    const currentQuota = Number(userRes.rows[0].lama_waktu_cuti ?? 12);

    if (jenis_cuti === "Cuti Tahunan" && totalDays > currentQuota) {
      return NextResponse.json(
        { message: `Sisa kuota cuti tahunan tidak mencukupi (Sisa: ${currentQuota} hari)` },
        { status: 400 }
      );
    }

    const insertRes = await pool.query(
      `INSERT INTO cuti (
        user_id,
        jenis_cuti,
        mulai_cuti,
        selesai_cuti,
        alamat_cuti,
        alasan,
        rekan_id,
        catatan_tugas,
        nomor_darurat,
        surat_lampiran
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        userId,
        jenis_cuti,
        startDate.toISOString(),
        endDate.toISOString(),
        alamat_cuti,
        alasan,
        Number(rekan_id),
        catatan_tugas,
        nomor_darurat,
        surat_lampiran || null,
      ]
    );

    if (jenis_cuti === "Cuti Tahunan") {
      await pool.query(
        "UPDATE users SET lama_waktu_cuti = GREATEST(0, lama_waktu_cuti - $1) WHERE user_id = $2",
        [Math.ceil(totalDays), userId]
      );
    }

    return NextResponse.json(
      {
        message: "Pengajuan cuti berhasil dikirim",
        cuti: insertRes.rows[0],
        setengah_hari: Boolean(setengah_hari),
        jumlah_hari: totalDays,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/cuti/ajukan error:", error);
    return NextResponse.json(
      { message: "Gagal mengajukan cuti", detail: error.message },
      { status: 500 }
    );
  }
}