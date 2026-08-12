import type { Metadata } from "next";
import "./globals.css";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { StorefrontShell } from "@/components/layout/storefront-shell";

export const metadata: Metadata = {
  title: "RC Catalog",
  description: "A production product catalog for curated commerce.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="storefront-shell antialiased">
        <StorefrontShell navbar={<Navbar />} footer={<Footer />}>
          {children}
        </StorefrontShell>
      </body>
    </html>
  );
}
