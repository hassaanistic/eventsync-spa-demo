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
      <head>
        {/* <!-- Snap Pixel Code --> */}
        <Script
          id="26fd5ed2-f829-4d55-a73a-b11fc8858b94"
          strategy="afterInteractive"
        >{`
        (function(e,t,n){
          if(e.snaptr) return;
          var a=e.snaptr=function(){
            a.handleRequest ? a.handleRequest.apply(a,arguments) : a.queue.push(arguments);
          };
          a.queue=[];
          var s='script';
          var r=t.createElement(s);
          r.async=true;
          r.src=n;
          var u=t.getElementsByTagName(s)[0];
          u.parentNode.insertBefore(r,u);
        })(window,document,'https://sc-static.net/scevent.min.js');
      `}</Script>
      </head>
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
          src="https://23d726edb008.ngrok-free.app/sdk/pk_live_74ee724b3e5d23a2d5207059.js"
          async
        ></script>
      </body>
    </html>
  );
}
