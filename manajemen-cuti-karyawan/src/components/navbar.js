
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const pathLink = [
  { nama: "Beranda", path: "/" },
  { nama: "Daftar", path: "/signin" },
  { nama: "Login", path: "/login" },
];

export default function navbar() {
  const pathname = usePathname();

  return (
    <nav className="p-2 bg-green-200 border-green-300 border-b font-bold font-sans flex flex-row justify-between">
        <div>
            <Link 
            className="text-2xl"
            href="/"
            >
                E-Cuti Hasan Office
            </Link>
            {pathLink.map((index) => {
                const isActive = index.path === "/" ? pathname === "/" : pathname.startsWith(index.path);

                return(
                    <li key={index.path}>
                        <Link
                        className={
                        isActive ? "flex flex-col text-black font-bold border-b-2 border-y-olive-800 pb-1" : " hover:text-green-900 transition"
                        }
                        href={index.path}
                        >
                            {index.nama}
                        </Link>
                    </li>
                )
            })}
        </div>
    </nav>
  );
}
