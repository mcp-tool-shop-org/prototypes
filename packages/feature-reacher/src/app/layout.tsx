import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Feature-Reacher | Adoption Risk Audits for Product Teams",
  description:
    "Surface underutilized features before they become technical debt. Run an Adoption Risk Audit in 2 minutes—no analytics required.",
  keywords: [
    "feature adoption",
    "product audit",
    "documentation analysis",
    "feature discovery",
    "adoption risk",
    "product management",
  ],
  authors: [{ name: "mcp-tool-shop" }],
  openGraph: {
    title: "Feature-Reacher | Adoption Risk Audits",
    description:
      "Surface underutilized features before they become technical debt. Run an audit in 2 minutes.",
    type: "website",
    siteName: "Feature-Reacher",
  },
  twitter: {
    card: "summary_large_image",
    title: "Feature-Reacher | Adoption Risk Audits",
    description:
      "Surface underutilized features before they become technical debt.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
