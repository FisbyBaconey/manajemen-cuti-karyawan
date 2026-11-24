"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const allLinks = [
  // When logged out
  { nama: "Login", path: "/", guestOnly: true },
  { nama: "Daftar", path: "/signin", guestOnly: true },

  // When logged in (filtered by role: 'admin', 'ketdiv', 'hrd', 'user')
  { nama: "Dashboard", path: "/dashboard", roles: ["admin", "ketdiv", "hrd", "user"] },
  { nama: "Profil", path: "/profil", roles: ["admin", "ketdiv", "hrd", "user"] },
  { nama: "Pengajuan Cuti", path: "/cuti/ajukan", roles: ["user", "ketdiv"] },
  { nama: "Verifikasi", path: "/verifikasi", roles: ["ketdiv"] },
  { nama: "Persetujuan Final", path: "/persetujuan", roles: ["hrd"] },
  { nama: "Kelola Data", path: "/admin", roles: ["admin"] },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (!saved || saved === "undefined") {
      setUser(null);
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      setUser(parsed || null);
    } catch {
      setUser(null);
    }
  }, [pathname]);

  function handleLogout() {
    localStorage.removeItem("user");
    setUser(null);
    router.push("/");
  }

  const visibleLinks = allLinks.filter((item) => {
    if (!user) return Boolean(item.guestOnly);
    if (item.guestOnly) return false;
    return item.roles?.includes(user.role);
  });

  return (
    <nav className="p-2 bg-green-200 border-green-300 border-b font-bold font-sans flex flex-row justify-between items-center">
      <div className="flex flex-row items-center gap-4">
        <Link className="text-2xl" href={user ? "/dashboard" : "/"}>
          E-Cuti Hasan Office
        </Link>

        <ul className="flex flex-row gap-4 list-none">
          {visibleLinks.map((item) => {
            const isActive =
              item.path === "/" ? pathname === "/" : pathname.startsWith(item.path);

            return (
              <li key={item.path}>
                <Link
                  className={
                    isActive
                      ? "flex flex-col text-black font-bold border-b-2 border-y-olive-800 pb-1"
                      : "hover:text-green-900 transition"
                  }
                  href={item.path}
                >
                  {item.nama}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {user && (
        <button
          type="button"
          onClick={handleLogout}
          className="px-3 py-1 bg-white/70 hover:bg-white rounded text-sm"
        >
          Logout
        </button>
      )}
    </nav>
  );
}