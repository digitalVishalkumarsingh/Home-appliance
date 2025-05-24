"use client";

import { useState, useEffect } from "react";
import AdminNavigation from "@/app/components/AdminNavigation";

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null; // Prevent hydration errors
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {children}
      <AdminNavigation />
    </div>
  );
}
