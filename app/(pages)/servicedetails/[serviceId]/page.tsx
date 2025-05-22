import ServiceDetailsClient from './ServiceDetailsClient';
import { Metadata } from 'next';

// Define the correct types for Next.js App Router
type Props = {
  params: Promise<{ serviceId: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

// Generate metadata for the page
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { serviceId } = await params;
  return {
    title: `Service Details | Dizit Solutions`,
    description: `View details and book service with ID: ${serviceId}`,
  };
}

// This is a dynamic route, so we don't pre-generate any paths
export function generateStaticParams() {
  return [];
}

// The page component
export default async function ServiceDetails({ params }: Props) {
  const { serviceId } = await params;
  return <ServiceDetailsClient serviceId={serviceId} />;
}
