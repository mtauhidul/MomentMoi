import type { Metadata } from "next";
import { Lato } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ServiceWorkerProvider } from "@/components/providers/ServiceWorkerProvider";
import { Toaster } from "sonner";
import { CacheManager } from "@/lib/cache-manager";

// Cache busting key for development
const APP_VERSION = process.env.NODE_ENV === 'development' ? Date.now() : '1.0.0';

// Local font - Ivy Presto Display
const ivyPrestoDisplay = localFont({
  src: "../../public/fonts/ivy-presto-display-light.otf",
  variable: "--font-ivy-presto",
  display: "swap",
});

// Google Font - Lato
const lato = Lato({
  weight: ["300", "400", "700"],
  subsets: ["latin"],
  variable: "--font-lato",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MomentMoi - Event Planning Platform",
  description:
    "Sophisticated event planning platform for couples, vendors, and event planners",
  manifest: "/manifest.json",
  themeColor: "#507c7b",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MomentMoi",
  },
  formatDetection: {
    telephone: false,
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
        {/* Cache busting meta tag */}
        <meta name="cache-version" content={APP_VERSION.toString()} />
        {process.env.NODE_ENV === 'development' && (
          <>
            <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
            <meta httpEquiv="Pragma" content="no-cache" />
            <meta httpEquiv="Expires" content="0" />
          </>
        )}
      </head>
      <body
        className={`${ivyPrestoDisplay.variable} ${lato.variable} antialiased`}
        suppressHydrationWarning={true}
        data-version={APP_VERSION}
      >
        <QueryProvider>
          <ServiceWorkerProvider>
            <AuthProvider>{children}</AuthProvider>
          </ServiceWorkerProvider>
        </QueryProvider>
        <Toaster />
        {process.env.NODE_ENV === 'development' && <CacheManager />}
      </body>
    </html>
  );
}
