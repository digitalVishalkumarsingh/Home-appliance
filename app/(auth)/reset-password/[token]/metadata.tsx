import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { token: string } }): Promise<Metadata> {
  return {
    title: `Reset Password | Dizit Solutions`,
    description: `Reset your password using the provided token`,
  };
}

// This is a dynamic route, so we don't pre-generate any paths
export function generateStaticParams() {
  return [];
}
