"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DiscountDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the edit page for now
    router.push(`/admin/discounts/${params.id}/edit`);
  }, [params.id, router]);

  return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      <p className="ml-2">Redirecting to discount edit page...</p>
    </div>
  );
}
