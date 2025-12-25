import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from 'next/link';
import { RealtimeNotifications } from "../components/RealtimeNotifications";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CrisisSync - Emergency Response Platform",
  description: "Unified real-time emergency response platform for coordinated safety and guidance.",
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const storedTheme = localStorage.getItem('theme');
                  if (storedTheme === 'dark' || (!storedTheme)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />

        <Link href="/" replace className="fixed top-6 left-6 z-50 group flex items-center justify-center bg-black dark:bg-white/10 backdrop-blur-md border border-black/10 dark:border-white/20 hover:bg-neutral-900 dark:hover:bg-white/20 transition-all w-12 h-12 rounded-xl shadow-lg no-underline">
          <span className="font-black text-xl tracking-tighter text-white">C<span className="text-orange-500">S</span></span>
        </Link>
        <RealtimeNotifications />
        {children}
      </body>
    </html >
  );
}
