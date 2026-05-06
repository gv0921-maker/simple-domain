// Phone number validation for B2C billing/delivery.
// Accepts an international prefix (+91 default) followed by 10–12 digits.

export const PHONE_PREFIXES = [
  { code: '+91', label: '🇮🇳 +91' },
  { code: '+1', label: '🇺🇸 +1' },
  { code: '+44', label: '🇬🇧 +44' },
  { code: '+971', label: '🇦🇪 +971' },
  { code: '+65', label: '🇸🇬 +65' },
  { code: '+60', label: '🇲🇾 +60' },
  { code: '+61', label: '🇦🇺 +61' },
  { code: '+49', label: '🇩🇪 +49' },
  { code: '+33', label: '🇫🇷 +33' },
] as const;

export function validatePhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s-]/g, '');
  if (!cleaned.startsWith('+')) return false;
  const digits = cleaned.replace(/^\+\d{1,3}/, '');
  return /^\d{10,12}$/.test(digits);
}

export function formatPhone(phone: string): string {
  return (phone || '').trim();
}

/** Splits a stored phone like "+91 9876543210" into prefix + national digits. */
export function splitPhone(phone: string): { prefix: string; number: string } {
  if (!phone) return { prefix: '+91', number: '' };
  const cleaned = phone.trim();
  const match = cleaned.match(/^(\+\d{1,3})\s?(.*)$/);
  if (!match) return { prefix: '+91', number: cleaned };
  return { prefix: match[1], number: match[2].replace(/\s/g, '') };
}