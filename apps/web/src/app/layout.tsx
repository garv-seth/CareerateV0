import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/auth/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Careerate AIntern",
  description: "Your AI Engineering Team",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-neutral-dark text-neutral-soft`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
} 