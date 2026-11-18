import { NextResponse } from "next/server"; 
import pool from "@/lib/db"; 
 
export async function POST(request) { 
  try { 
    const { email, password } = await request.json(); 
 
    // 1. Cari user berdasarkan email saja
    const result = await pool.query(
    "SELECT id, nama, email, password FROM users WHERE email = $1",
    [email]
    );

    // 2. Cek apakah email ditemukan
    if (result.rows.length === 0) {
    return NextResponse.json(
        { message: "Email tidak terdaftar" },
        { status: 401 }
    );
    }

    const user = result.rows[0];

    // 3. Cek apakah password cocok 
    // (Catatan: Seharusnya menggunakan bcrypt.compare, bukan perbandingan teks biasa)
    const isPasswordValid = password === user.password; 

    if (!isPasswordValid) {
    return NextResponse.json(
        { message: "Password salah" },
        { status: 401 }
    );
    }

    // Jika lolos, login sukses
    return NextResponse.json({ message: "Login berhasil", userId: user.id }); 
        return NextResponse.json({ 
    
        message: "Login berhasil", 
        user: result.rows[0], 
        }); 
    } catch (error) { 
    console.error(error); 
    
    return NextResponse.json( 
      { message: "Terjadi kesalahan pada server" }, 
      { status: 500 } 
    ); 
  } 
} 