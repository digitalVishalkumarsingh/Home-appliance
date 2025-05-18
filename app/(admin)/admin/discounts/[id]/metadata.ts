import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  return {
    title: `Discount Details | Admin Dashboard`,
    description: `View discount details for ID: ${params.id}`,
  };
}

// This is a dynamic route, so we don't pre-generate any paths
export function generateStaticParams() {
  return [];
}
