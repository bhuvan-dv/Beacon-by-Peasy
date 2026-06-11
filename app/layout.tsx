import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Beacon by Peasy",
  description:
    "An AI-powered purchasing co-pilot for CPG brands. Beacon flags reorders before they become stockouts.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
