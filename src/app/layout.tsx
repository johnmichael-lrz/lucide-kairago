import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";
import { SettingsApplier } from "@/components/SettingsApplier";
import { LanguageProvider } from "@/context/LanguageContext";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kairago",
  description: "Hyperlocal climate risk intelligence for Philippine barangays",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} dark`}>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
        <link rel="icon" href="/logo.png" />
        <meta name="theme-color" content="#1a0f08" />
      </head>
      <body
        className={`${plusJakartaSans.variable} font-sans antialiased min-h-screen bg-[#0D1F15]`}
      >
        <div className="min-h-screen w-full">
          <div
            className="mx-auto min-h-screen w-full max-w-[390px]"
            style={{ backgroundColor: "hsl(25, 40%, 8%)" }}
          >
            <LanguageProvider>
              <SettingsApplier />
              {children}
              <BottomNav />
            </LanguageProvider>
          </div>
        </div>
      </body>
    </html>
  );
}