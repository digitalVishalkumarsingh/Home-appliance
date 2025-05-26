"use client";

import { TechnicianJobProvider } from "@/app/contexts/TechnicianJobContext";
import TechnicianHeader from "@/app/components/technician/TechnicianHeader";

export default function TechnicianLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TechnicianJobProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Technician Header */}
        <TechnicianHeader />

        {/* Main Content */}
        <div className="w-full">
          {children}
        </div>
      </div>
    </TechnicianJobProvider>
  );
}
