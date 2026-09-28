import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Toaster } from "sonner";

// Load user-provided MTN Brighter Sans Bold
const mtnBrighterSans = localFont({
  src: "./fonts/MTN-BrighterSans-Bold.ttf",
  variable: "--font-header",
  display: "swap",
  weight: "700",
});

// Load user-provided DMSans-Medium for Hero headers
const dmSansMedium = localFont({
  src: "./fonts/DMSans-Medium.ttf",
  variable: "--font-hero",
  display: "swap",
  weight: "500",
});

export const metadata: Metadata = {
  title: "Valence — Automated Investing for Tokenized Equities on Robinhood Chain",
  description:
    "Goal-based, automated investing app for tokenized stocks on Robinhood Chain. AI proposes, deterministic code disposes.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: [
      { url: "/favicon.png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${mtnBrighterSans.variable} ${dmSansMedium.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap"
          rel="stylesheet"
        />
        <script src="https://accounts.google.com/gsi/client" async defer></script>
      </head>
      <body className="min-h-screen bg-background font-body text-foreground antialiased selection:bg-primary/30 selection:text-white">
        <Navbar />
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
        <Toaster position="top-right" theme="dark" richColors closeButton />
      </body>
    </html>
  );
}
