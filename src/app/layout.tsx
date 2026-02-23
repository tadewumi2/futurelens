import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FutureLens — Talk to Your Future Self",
  description:
    "AI-powered life simulation platform. Have a real-time voice conversation with data-grounded versions of your future self.",
  keywords: ["AI", "life simulation", "future self", "voice AI", "Amazon Nova"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="grain" />
        {children}
      </body>
    </html>
  );
}
