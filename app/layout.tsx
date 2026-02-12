import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0f0d",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Flip 7 · Score Companion",
  description:
    "Real-time scoring companion for the Flip 7 card game. Track cards, compute scores, and compete with friends.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Flip 7",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
          <Toaster
            theme="dark"
            richColors
            position="top-center"
            toastOptions={{
              style: {
                background: "#111916",
                border: "1px solid rgba(107, 124, 114, 0.2)",
                color: "#f0ead6",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
