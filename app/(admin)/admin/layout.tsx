"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import AdminSidebar from "@/app/components/admin/AdminSidebar";
import AdminHeader from "@/app/components/admin/AdminHeader";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        // Check localStorage first for faster initial load
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");

        if (!token || !userStr) {
          router.push("/admin/login");
          return;
        }

        // Parse user data from localStorage for immediate display
        try {
          const userData = JSON.parse(userStr);
          if (userData.role === "admin") {
            setUser(userData);
            setIsLoading(false); // Set loading false immediately for faster UI
          }
        } catch (parseError) {
          console.error("Error parsing user data:", parseError);
          router.push("/admin/login");
          return;
        }

        // Verify with server in background (don't block UI)
        const response = await fetch("/api/auth/me", {
          method: 'GET',
          credentials: 'include', // Include cookies in the request
        });

        if (!response.ok) {
          // If server verification fails, redirect to login
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.push("/admin/login");
          return;
        }

        const data = await response.json();
        if (!data.success || data.user?.role !== "admin") {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.push("/admin/login");
          return;
        }

        // Update user data if different from localStorage
        if (JSON.stringify(data.user) !== userStr) {
          setUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
        }
      } catch (error) {
        console.error("Error checking admin auth:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/admin/login");
      }
    };

    checkAdminAuth();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    toast.success("Logged out successfully");
    router.push("/admin/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64">
        <AdminHeader
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={handleLogout}
        />

        <main className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}