import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from './providers';
import { MetaTags } from 'leadstor';
import { ToastContainer } from "react-toastify";

import "./globals.css";
import "./fonts.google.css";
import 'react-toastify/ReactToastify.min.css';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = MetaTags;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth" data-theme="light">
      <body>
        <Providers>
          <ToastContainer position="top-right" autoClose={3000} />
          {children}
        </Providers>
      </body>
    </html>
  );
}
