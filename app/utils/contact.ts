export interface ContactDetails {
  phone?: string;
  whatsapp?: string;
  email?: string;
}

export function normalizeContact(data: Record<string, unknown>): ContactDetails {
  const phone = typeof data.contact_phone === 'string' ? data.contact_phone.trim().replace(/[ ()-]/g, '') : '';
  const whatsapp = typeof data.contact_whatsapp === 'string' ? data.contact_whatsapp.trim().replace(/[+ ()-]/g, '') : '';
  const email = typeof data.contact_email === 'string' ? data.contact_email.trim() : '';
  return {
    phone: /^\+[1-9]\d{7,14}$/.test(phone) ? phone : undefined,
    whatsapp: /^[1-9]\d{7,14}$/.test(whatsapp) ? whatsapp : undefined,
    email: /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) && !/[\r\n?&#]/.test(email) ? email : undefined,
  };
}

export function bannerLink(value: string | null): string | undefined {
  if (!value) return undefined;
  if (/^\/(?!\/)/.test(value) && !/[\\\r\n]/.test(value)) return value;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined;
  } catch { return undefined; }
}
