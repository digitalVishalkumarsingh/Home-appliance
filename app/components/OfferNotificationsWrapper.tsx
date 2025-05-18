"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamically import the OfferNotifications component
const OfferNotifications = dynamic(() => import("./OfferNotifications"), {
  ssr: false,
});

export default function OfferNotificationsWrapper() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return <OfferNotifications />;
}
