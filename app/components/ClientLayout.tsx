"use client";

import { ReactNode } from "react";
import dynamic from "next/dynamic";

// Dynamically import the OfferNotifications component with no SSR
const OfferNotifications = dynamic(
  () => import("./OfferNotifications"),
  { ssr: false }
);

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <OfferNotifications />
    </>
  );
}
