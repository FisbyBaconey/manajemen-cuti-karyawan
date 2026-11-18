import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";

export default function RootLayout({ children }) {
  return (
    <html
      lang="id">
      <body className="font-mono">
        <Navbar/>
        {children}
      </body>
    </html>
  );
}
