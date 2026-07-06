import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import ThemeProvider from "@/components/ThemeProvider";
import NavBar from "@/components/NavBar";
import VaultGuard from "@/components/VaultGuard";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster } from "sonner";
import BrandThemeProvider from "@/components/BrandThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SmartBudget - Personal Finance Cockpit",
  description:
    "A privacy-first budgeting app for planning, tracking, and growing your money from one clear dashboard. Local-first, modern UI, no bank linking required.",
  manifest: "/manifest.webmanifest",
  applicationName: "SmartBudget",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SmartBudget",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef1fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0b12" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <ThemeProvider>
          <ErrorBoundary>
            <StoreProvider>
              <BrandThemeProvider>
                <NavBar />
                <main className="flex-1 w-full max-w-7xl mx-auto px-3.5 sm:px-4 md:px-6 py-4 md:py-6 pb-28 lg:pb-6">
                  <VaultGuard>{children}</VaultGuard>
                </main>
                <footer className="text-center text-xs text-[var(--muted)] py-6 px-4 space-y-1">
                  <p>SmartBudget — your data stays on this device. No servers, no tracking.</p>
                  <p className="text-[10px] opacity-75">Educational purpose only. Not financial advice. Not SEBI registered investment advice.</p>
                </footer>
              </BrandThemeProvider>
            </StoreProvider>
          </ErrorBoundary>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "var(--glass-bg-strong)",
                backdropFilter: "blur(16px)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
                fontSize: "0.875rem",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
