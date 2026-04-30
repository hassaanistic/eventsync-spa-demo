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
  description:
    "Test auto-tracking, consent, and manual events inside a Next.js app.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="layout-shell">
          <NavBar />
          <main className="main-content">{children}</main>
        </div>
        <ConsentBanner />

        <script
          src="https://8e9c-182-186-104-99.ngrok-free.app/sdk/pk_live_0eed01baecf4235de5d46fd1.js"
          async
        ></script>
      </body>
    </html>
  );
}
