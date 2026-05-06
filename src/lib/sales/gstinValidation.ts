// Indian GSTIN format validator.
// Format: 2-digit state code + 10-char PAN + 1 entity number + 'Z' + check char

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export function validateGSTIN(gstin: string): boolean {
  if (!gstin) return false;
  return GSTIN_REGEX.test(gstin.toUpperCase().trim());
}