import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "./components/LayoutWrapper";
import { Toaster } from 'react-hot-toast';
import OfferNotificationsClient from "./components/OfferNotificationsClient";
import NewUserWelcome from "./components/NewUserWelcome";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dizit Solutions - Professional Appliance Repair Services",
  description: "Dizit Solutions offers professional repair services for AC, washing machines, and other home appliances. Book our expert technicians today.",
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
        <Toaster position="top-center" />
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
        <OfferNotificationsClient />
        <NewUserWelcome />
      </body>
    </html>
  );
}
