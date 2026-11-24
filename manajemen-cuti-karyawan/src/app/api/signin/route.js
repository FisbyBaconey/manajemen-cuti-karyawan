import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(request) {
  try {
    const { nama, email, password } = await request.json();

    if (!nama || !email || !password) {
      return NextResponse.json(
        { message: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    await pool.query(
      "INSERT INTO users (nama, email, password, role) VALUES ($1, $2, $3, 'user')",
      [nama, email, password]
    );

    return NextResponse.json(
      { message: "Registrasi berhasil! Selamat Datang di E-cuti Hasan Office!." },
      { status: 201 }
    );
  } catch (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { message: "Email atau nama sudah terdaftar" },
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