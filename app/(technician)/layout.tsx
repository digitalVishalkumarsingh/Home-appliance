"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import TechnicianSidebar from "../components/technician/TechnicianSidebar";
import { TechnicianJobProvider } from "../contexts/TechnicianJobContext";

export default function TechnicianLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in and is a technician
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Please login to access technician dashboard");
          router.push("/login");
          return;
        }

        // Verify token with server
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            toast.error("Session expired. Please login again.");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            router.push("/login");
            return;
          }
          throw new Error('Authentication failed');
        }

        const data = await response.json();
        if (!data.success || !data.user) {
          throw new Error('Invalid user data');
        }

        if (data.user.role !== "technician") {
          toast.error("Unauthorized access. This area is for technicians only.");
          router.push("/login");
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error("Authentication error:", error);
        toast.error("Authentication error. Please login again.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect in useEffect
  }

  return (
    <TechnicianJobProvider>
      <div className="min-h-screen bg-gray-50 flex">
        <TechnicianSidebar />
        <div className="flex-1 md:ml-64 transition-all duration-300">
          {/* We'll remove the header since we only want one navigation component */}
          <main className="p-4 md:p-6">{children}</main>
        </div>
      </div>
    </TechnicianJobProvider>
  );
}
