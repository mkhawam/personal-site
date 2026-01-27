import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// import NavBar from "./components/Navbar"; // Now handled by Shell
import Shell from "./components/Shell";
import { headers } from "next/headers";

import ServiceWorkerRegister from "./components/ServiceWorkerRegister";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mohamad Khawam",
  description: "Personal website of Mohamad Khawam",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#09090b",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const heads = await headers();
  const theme = heads.get("x-theme") || "cupcake";

  return (
    <html lang="en" data-theme={theme}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#09090b" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}
      >
        <ServiceWorkerRegister />
        <Toaster />
        <Shell>
          {children}
        </Shell>

      </body>
    </html>
  );
}
