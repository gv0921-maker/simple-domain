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
  if (!phone || !phone.trim()) return false;

  const cleaned = phone.replace(/[\s-]/g, '').trim();

  if (cleaned.startsWith('+')) {
    const withoutPlus = cleaned.slice(1);
    const match = withoutPlus.match(/^(\d{1,3})(\d+)$/);
    if (!match) return false;
    const localNumber = match[2];
    return localNumber.length >= 7 && localNumber.length <= 12;
  }

  return /^\d{7,12}$/.test(cleaned);
}

export function formatPhone(phone: string): string {
  return (phone || '').trim();
}

/** Splits a stored phone like "+91 9876543210" into prefix + national digits. */
export function splitPhone(phone: string): { prefix: string; number: string } {
  if (!phone) return { prefix: '+91', number: '' };
  const cleaned = phone.trim();
  if (!cleaned.startsWith('+')) {
    return { prefix: '+91', number: cleaned.replace(/\D/g, '') };
  }
  // Match against known prefixes (longest first) to handle "+919876543210".
  const codes = [...PHONE_PREFIXES].map(p => p.code).sort((a, b) => b.length - a.length);
  for (const code of codes) {
    if (cleaned.startsWith(code)) {
      const rest = cleaned.slice(code.length).replace(/\s/g, '').replace(/\D/g, '');
      return { prefix: code, number: rest };
    }
  }
  const match = cleaned.match(/^(\+\d{1,3})\s?(.*)$/);
  if (!match) return { prefix: '+91', number: cleaned.replace(/\D/g, '') };
  return { prefix: match[1], number: match[2].replace(/\D/g, '') };
}