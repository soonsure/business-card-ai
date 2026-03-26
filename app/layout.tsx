import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Card Capture",
  description: "Upload a business card and turn it into structured contact data."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
