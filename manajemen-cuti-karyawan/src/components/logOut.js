"use client"
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";


export default function logOutDoubleCheck(){
    const router = useRouter();
    const [open, setOpen] = useState(false);

    async function handleLogout() {
        await fetch("/api/logout", { method: "POST" });
        localStorage.removeItem("user");
        router.push("/");
    }
    return(
        <div>
            <button
            onClick={() => setOpen(true)}>
                Log Out
            </button>
            
            {open && (
            <div>
                <span>
                    Yakin ingin Log Out?
                </span>
                <button
                onClick={handleLogout}>Iya</button>
                <button
                onClick={() => setOpen(false)}>Tidak</button>
            </div>)}
        </div>
    )
}