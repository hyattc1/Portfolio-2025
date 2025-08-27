import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Providers from "@/components/Providers";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Calistoga, Inter } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});
const calistoga = Calistoga({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Connor Hyatt",
  description: "My personal site to showcase my developer work and opinions.",
  icons: {
    icon: [
      { url: '/CHlogo.png?v=3', type: 'image/png' },
      { url: '/CHlogo.png?v=3', sizes: '32x32', type: 'image/png' },
      { url: '/CHlogo.png?v=3', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/CHlogo.png?v=3',
    apple: '/CHlogo.png?v=3',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/CHlogo.png?v=3" />
        <link rel="shortcut icon" type="image/png" href="/CHlogo.png?v=3" />
        <link rel="apple-touch-icon" href="/CHlogo.png?v=3" />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable,
          calistoga.variable,
        )}
      >
        <Providers>
          <Header />
          <div className="mx-auto flex max-w-3xl flex-col px-8">
            <main className="grow">{children}</main>
          </div>
          <Footer />
        </Providers>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
