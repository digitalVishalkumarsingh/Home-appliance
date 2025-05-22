import EditDiscountClient from './EditDiscountClient';
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
    title: `Edit Discount | Admin Dashboard`,
    description: `Edit discount details for ID: ${id}`,
  };
}

// This is a dynamic route, so we don't pre-generate any paths
export function generateStaticParams() {
  return [];
}

// The page component
export default async function EditDiscountPage({ params }: Props) {
  const { id } = await params;
  return <EditDiscountClient id={id} />;
}
