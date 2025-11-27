import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import ConsentBanner from "@/components/ConsentBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EventsIQ SDK SPA Playground",
  description: "Test auto-tracking, consent, and manual events inside a Next.js app.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="layout-shell">
          <NavBar />
          <main className="main-content">{children}</main>
        </div>
        <ConsentBanner />
       
        <script src="https://9d3c3c3aed9a.ngrok-free.app/sdk/pk_live_1b4068e9f47170cc4a79ec2c.js" async></script>
        {/* <script src="https://9d3c3c3aed9a.ngrok-free.app/sdk/pk_live_b06a4e2e8642e4da38f7c8d4.js" async></script> */}
         </body>
    </html>
  );
}
