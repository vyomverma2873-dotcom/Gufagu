import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import GalaxyBackground from "@/components/layout/GalaxyBackground";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Guftagu - Random Video Chat",
  description: "Connect with strangers from around the world through random video chats. Make new friends, have conversations, and explore different cultures.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-zinc-950 text-white min-h-screen`}>
        <Providers>
          {/* Galaxy Background */}
          <GalaxyBackground />
          
          {/* Main Content Layer */}
          <div className="relative z-10">
            <Header />
            <main className="pt-16">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
