import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProviders } from "../components/AppProviders";
import { PwaRegister } from "../components/PwaRegister";

export const metadata: Metadata = {
  title: "TEN Tasks - Pengelola Task Mobile",
  description: "Aplikasi pengelola tugas mobile modern, cerdas, dan terfokus untuk produktivitas harian Anda",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TEN Tasks",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1d4ed8",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <PwaRegister />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
