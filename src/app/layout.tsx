import type { Metadata } from "next";
import "./globals.css";

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
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
