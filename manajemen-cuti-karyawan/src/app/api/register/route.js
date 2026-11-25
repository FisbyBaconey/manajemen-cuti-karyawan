import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(request) {
  try {
    const { nama, username, email, password } = await request.json();

    if (!nama || !email || !password) {
      return NextResponse.json(
        { message: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    const generatedUsername =
      (username && username.trim()) ||
      email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "") +
        "_" +
        Math.floor(100 + Math.random() * 900);

    await pool.query(
      "INSERT INTO users (nama, email, password, role, aktif) VALUES ($1, $2, $3, 'user', FALSE)",
      [nama.trim(), email.trim(), password]
    );

    return NextResponse.json(
      {
        message:
          "Registrasi berhasil! Akun Anda menunggu persetujuan Admin sebelum dapat login.",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { message: "Email atau username sudah terdaftar" },
        { status: 409 }
      );
    }

    console.error("Register API error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server", detail: error.message },
      { status: 500 }
    );
  }
}