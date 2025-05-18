/**
 * Utility functions to get contact information from environment variables
 */

// Get WhatsApp number from environment variable or use fallback
export const getWhatsAppNumber = (): string => {
  return process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '9112564731';
};

// Get call number from environment variable or use fallback
export const getCallNumber = (): string => {
  return process.env.NEXT_PUBLIC_CALL_NUMBER || '9112564731';
};

// Get general phone number from environment variable or use fallback
export const getPhoneNumber = (): string => {
  return process.env.NEXT_PUBLIC_PHONE || '9112564731';
};

// Format phone number for display (e.g., add spaces or formatting)
export const formatPhoneNumber = (phoneNumber: string): string => {
  return phoneNumber;
};

// Generate WhatsApp link with pre-filled message
export const getWhatsAppLink = (message: string): string => {
  const phoneNumber = getWhatsAppNumber();
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
};

// Generate call link
export const getCallLink = (): string => {
  const phoneNumber = getCallNumber();
  return `tel:${phoneNumber}`;
};
