export interface ContactConfig {
  id: string;
  phone: string;
  email: string;
  supportTimings: string;
  whatsapp: string;
  address: string;
}

export const contactConfig: ContactConfig = {
  id: 'contact-config',
  phone: '+1-555-0100',
  email: 'support@northstarcommerce.com',
  supportTimings: 'Mon–Fri: 9:00 AM – 6:00 PM',
  whatsapp: '+15550100',
  address: '123 Market Street, Suite 400, New York, NY 10001',
};
