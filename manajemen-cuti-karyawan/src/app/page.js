"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pesan, setPesan] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setPesan("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPesan(data.message || "Login gagal.");
        return;
      }

      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      setPesan("Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white">
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="email">Alamat E-mail</label>

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

          <div className="input-wrapper">
            <span className="input-icon">♙</span>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        {pesan && (
          <div className="auth-message error-message">
            {pesan}
          </div>
        )}

        <button
          type="submit"
          className="auth-button"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Login ke Akun"}
          {!loading && <span>→</span>}
        </button>
      </form>
      <Link href="/register">Belum memiliki akun?</Link>
    </div>
  );
}