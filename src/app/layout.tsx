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

        {/* <script
          src="https://events-iq-hub.vercel.app/sdk/pk_live_74ee724b3e5d23a2d5207059.js"
          async
        ></script> */}

        <script
          src="https://11806c37445f.ngrok-free.app/sdk/pk_live_74ee724b3e5d23a2d5207059.js"
          async
        ></script>
      </body>
    </html>
  );
}
