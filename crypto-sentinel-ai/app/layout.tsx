import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Crypto Sentinel AI — Intelligence Terminal",
  description:
    "Institutional-grade crypto intelligence. Fuses on-chain, market, protocol, developer, governance, news and social signals into transparent, explainable, probability-based risk scores. Runs at $0 — no paid APIs required.",
  applicationName: "Crypto Sentinel AI",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Sentinel" },
};

export const viewport: Viewport = {
  themeColor: "#05070d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
