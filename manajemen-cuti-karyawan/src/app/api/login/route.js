import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email dan password wajib diisi" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `SELECT user_id, nama, email, password, role, aktif, divisi_id
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: "Email tidak terdaftar" },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    if (password !== user.password) {
      return NextResponse.json(
        { message: "Password salah" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      message: "Login berhasil",
      user: {
        user_id: user.user_id,
        nama: user.nama,
        email: user.email,
        role: user.role,
        aktif: user.aktif,
        divisi_id: user.divisi_id,
      },
    });
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server", detail: error.message },
      { status: 500 }
    );
  }
}