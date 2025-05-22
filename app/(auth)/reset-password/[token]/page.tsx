import ResetPasswordClient from './ResetPasswordClient';
import { Metadata } from 'next';

// Define the correct types for Next.js App Router
type Props = {
  params: Promise<{ token: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

// The page component
export default async function ResetPasswordPage({ params }: Props) {
  const { token } = await params;
  return <ResetPasswordClient token={token} />;
}
