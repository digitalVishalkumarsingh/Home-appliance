import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { ToastProvider } from './components/ui/Toast';
import OfferNotificationsClient from "./components/OfferNotificationsClient";
import NewUserWelcome from "./components/NewUserWelcome";
import FirstTimeBookingNotification from "./components/FirstTimeBookingNotification";
import MainLayout from "./components/MainLayout";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dizit Solutions - 24/7 Professional Appliance Repair Services",
  description: "Dizit Solutions offers 24/7 professional repair services for AC, washing machines, and other home appliances. Book our expert technicians anytime, 7 days a week.",
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
        <ToastProvider>
          <MainLayout>
            {children}
          </MainLayout>
          <OfferNotificationsClient />
          <NewUserWelcome />
          <FirstTimeBookingNotification />
        </ToastProvider>
      </body>
    </html>
  );
}
