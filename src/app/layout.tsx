import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";
import CommandPalette from "./components/CommandPalette";
import { headers } from "next/headers";

import ServiceWorkerRegister from "./components/ServiceWorkerRegister";
import { Toaster } from "sonner";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mohamadk.com";

const DESCRIPTION =
  "Application Developer at Rutgers University. Full-stack platforms, infrastructure automation, and security.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Mohamad Khawam",
    template: "%s · Mohamad Khawam",
  },
  description: DESCRIPTION,
  authors: [{ name: "Mohamad Khawam", url: SITE_URL }],
  creator: "Mohamad Khawam",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Mohamad Khawam",
    title: "Mohamad Khawam",
    description: DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mohamad Khawam",
    description: DESCRIPTION,
  },
};

export const THEME_COLORS: Record<string, string> = {
  midnight: "#0b1120",
  daylight: "#f8fafc",
};

export async function generateViewport(): Promise<Viewport> {
  const heads = await headers();
  const theme = heads.get("x-theme") || "midnight";

  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: THEME_COLORS[theme] ?? THEME_COLORS.midnight,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const heads = await headers();
  const theme = heads.get("x-theme") || "midnight";

  // Resolved on the server so the nav renders its final shape in the first paint,
  // with no authenticated-only items flashing in after a client-side check.
  const authToken = (await cookies()).get("auth_token")?.value;
  const isAuthed = Boolean(authToken && (await verifyToken(authToken)));

  return (
    <html lang="en" data-theme={theme}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-dvh flex flex-col font-sans selection:bg-primary/30`}
      >
        <ServiceWorkerRegister />
        <Toaster />
        <CommandPalette isAuthed={isAuthed} />
        <SiteHeader isAuthed={isAuthed} />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
