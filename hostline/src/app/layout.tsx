import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hostline",
  description:
    "Hostline is an AI front desk powered by Grok Voice. Answer calls, qualify leads, and book meetings for South African SMEs.",
  openGraph: {
    title: "Hostline",
    description: "AI front desk powered by Grok Voice Agent.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
