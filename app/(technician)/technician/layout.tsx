"use client";

import { TechnicianJobProvider } from "@/app/contexts/TechnicianJobContext";

export default function TechnicianLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TechnicianJobProvider>
      <div className="w-full">
        {children}
      </div>
    </TechnicianJobProvider>
  );
}
