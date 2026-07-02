import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Annoting — Labeled data, quality guaranteed",
    template: "%s · Annoting",
  },
  description:
    "Annoting turns raw image datasets into labeled, quality-verified annotation files. Upload your data, track progress in real time, download COCO, YOLO or Pascal VOC.",
  metadataBase: new URL("https://annoting.com"),
  openGraph: {
    title: "Annoting — Labeled data, quality guaranteed",
    description:
      "Upload image datasets. Get labeled, QA-verified annotations back. COCO · YOLO · Pascal VOC.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
