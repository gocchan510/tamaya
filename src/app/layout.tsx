import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://tamaya-iota.vercel.app"),
  title: "Tamaya — 花火大会ガイド",
  description: "全国の花火大会の日程・抽選情報・天気をまとめたガイドアプリ",
  applicationName: "たまや",
  appleWebApp: {
    capable: true,
    title: "たまや",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: "Tamaya — 花火大会ガイド",
    description: "全国の花火大会の日程・抽選情報・天気をまとめたガイドアプリ",
    siteName: "たまや",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tamaya — 花火大会ガイド",
    description: "全国の花火大会の日程・抽選情報・天気をまとめたガイドアプリ",
  },
};

export const viewport: Viewport = {
  themeColor: "#03030f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
