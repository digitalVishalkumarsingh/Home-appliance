import DiscountDetailClient from './DiscountDetailClient';
import { Metadata } from 'next';

// Define the correct types for Next.js App Router
type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

// Generate metadata for the page
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Discount Details | Admin Dashboard`,
    description: `View discount details for ID: ${id}`,
  };
}

// This is a dynamic route, so we don't pre-generate any paths
export function generateStaticParams() {
  return [];
}

// The page component
export default async function DiscountDetailPage({ params }: Props) {
  const { id } = await params;
  return <DiscountDetailClient id={id} />;
}

