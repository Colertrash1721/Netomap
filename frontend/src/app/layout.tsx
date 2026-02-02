"use client";
import { Comfortaa } from 'next/font/google';
import "./globals.css";

const comfortaa = Comfortaa({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-comfortaa',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>NetoMonitor</title>
        <link
          href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css"
          rel="stylesheet"
        ></link>
      </head>
      <body className={`${comfortaa.className} `}>
        <main className={`flex flex-row items-center justify-center w-full h-screen bg-gray-100 `}>
          {children}
        </main>
      </body>
    </html>
  );
}