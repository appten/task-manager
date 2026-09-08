import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProviders } from "../components/AppProviders";

export const metadata: Metadata = {
  title: "TEN Tasks - Pengelola Task Mobile",
  description: "Aplikasi pengelola tugas mobile modern, cerdas, dan terfokus untuk produktivitas harian Anda",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
