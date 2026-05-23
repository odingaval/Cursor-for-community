import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cursor for Communities",
  description: "Real-time collaborative IDE with AI for hackathons and developer teams",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="antialiased h-full font-sans text-gray-100">
        {children}
      </body>
    </html>
  );
}
