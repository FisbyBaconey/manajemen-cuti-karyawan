"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignIn() {
    const router = useRouter();

    const [nama, setNama] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [pesan, setPesan] = useState("");
    const [loading, setLoading] = useState(false);

    async function addAccount(e) {
        e.preventDefault();
        setPesan("");
        setLoading(true);

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nama, email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setPesan(data.message || "Gagal membuat akun.");
                return;
            }

            setPesan("Akun berhasil dibuat!");
            router.push("/");
        } catch (error) {
            setPesan("Tidak dapat terhubung ke server. Coba lagi.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <form onSubmit={addAccount} className="regist-form">
                <div className="form-group">
                    <label htmlFor="nama">Nama Lengkap</label>
                    <input
                        id="nama"
                        type="text"
                        placeholder="Nama lengkap"
                        value={nama}
                        onChange={(e) => setNama(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <div className="input-wrapper">
                        <span className="input-icon">✉</span>
                        <input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                {pesan && <p>{pesan}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? "Menyimpan..." : "Daftar"}
                </button>
            </form>
        </div>
    );
}