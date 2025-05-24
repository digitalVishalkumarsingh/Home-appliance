"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import AdminSidebar from "@/app/components/admin/AdminSidebar";
import AdminHeader from "@/app/components/admin/AdminHeader";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/admin/login");
          return;
        }

        const response = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user?.role === "admin") {
            setUser(data.user);
          } else {
            toast.error("Access denied. Admin credentials required.");
            router.push("/admin/login");
          }
        } else {
          router.push("/admin/login");
        }
      } catch (error) {
        console.error("Error checking admin auth:", error);
        router.push("/admin/login");
      } finally {
        setIsLoading(false);
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