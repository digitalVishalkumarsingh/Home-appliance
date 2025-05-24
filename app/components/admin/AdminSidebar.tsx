"use client";

import EnhancedSidebar from "./EnhancedSidebar";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    
    // Redirect to login page
    window.location.href = "/admin/login";
  };

  return (
    <EnhancedSidebar
      isOpen={isOpen}
      toggleSidebar={onClose}
      onLogout={handleLogout}
      userName="Admin"
      userRole="Administrator"
    />
  );
}
