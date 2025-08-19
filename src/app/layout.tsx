import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import AuthProvider from "@/components/AuthProvider";
import AnnouncementBar from "@/components/AnnouncementBar";
import { Analytics } from '@vercel/analytics/next';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sioux Ping Pong Tournament 2025",
  description: "Company ping pong tournament bracket and knockout stage progression",
  icons: {
    icon: "/paddle.svg",
  },
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
        style={{ '--primary-color': '#F15D03' } as React.CSSProperties}
      >
        <AuthProvider>
          <AnnouncementBar />
          <Navigation />
          <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
            {children}
            <Analytics />
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
