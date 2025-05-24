import { Metadata } from "next";
import DiscountDetailClient from "./DiscountDetailClient";

// Define types for Next.js App Router
type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};



// Fetches discount name for metadata
async function fetchDiscountName(id: string, token?: string): Promise<string | null> {
  try {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/discounts/${id}`, {
      headers,
      cache: "no-store", // Ensure fresh data for SSR
    });

    if (!response.ok) {
      console.error(`Failed to fetch discount: ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (data.success && data.discount?.name) {
      return data.discount.name;
    }
    return null;
  } catch (error) {
    console.error("Error fetching discount for metadata:", error);
    return null;
  }
}

// Generates metadata for the Discount Detail page
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const defaultTitle = "Discount Details | Admin Dashboard";
  const defaultDescription = `View discount details for ID: ${id}`;

  // Attempt to fetch discount name for dynamic metadata
  // Token may not be available server-side; fallback to default if unauthorized
  const token = typeof window === "undefined" ? undefined : localStorage.getItem("token") ?? undefined;
  const discountName = await fetchDiscountName(id, token);

  const title = discountName ? `${discountName} Details | Admin Dashboard` : defaultTitle;
  const description = discountName ? `View details for ${discountName} discount` : defaultDescription;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/admin/discounts/${id}`,
      siteName: "Admin Dashboard",
      type: "website",
      locale: "en_IN",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

// Dynamic route with no static paths
export function generateStaticParams() {
  return [];
}

// The page component
export default async function DiscountDetailPage({ params }: Props) {
  const { id } = await params;
  return <DiscountDetailClient id={id} />;
}