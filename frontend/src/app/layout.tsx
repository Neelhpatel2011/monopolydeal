import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./theme.css";

export const metadata: Metadata = {
  title: "Monopoly Deal",
  description: "Collect 3 complete property sets to win",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
