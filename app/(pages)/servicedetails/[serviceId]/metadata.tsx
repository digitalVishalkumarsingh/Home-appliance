import { Metadata } from 'next';
import { services } from '@/app/lib/services';

type Props = {
  params: { serviceId: string };
};

// Sanitize text for safe usage
const sanitizeText = (text: string) => text.replace(/[<>"'&]/g, "");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Find the service by ID
  const service = services.find(s => s.id === params.serviceId);
  
  if (!service) {
    return {
      title: 'Service Not Found | Dizit Solutions',
      description: 'The requested service could not be found.',
    };
  }

  const safeTitle = sanitizeText(service.title);
  
  return {
    title: `${safeTitle} | Dizit Solutions`,
    description: service.desc.slice(0, 160),
    keywords: `${safeTitle}, Dizit Solutions, service, repair, maintenance`,
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: `${safeTitle} | Dizit Solutions`,
      description: service.desc.slice(0, 160),
      images: [
        {
          url: service.img,
          width: 1200,
          height: 630,
          alt: safeTitle,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${safeTitle} | Dizit Solutions`,
      description: service.desc.slice(0, 160),
      images: [service.img],
    },
  };
}
