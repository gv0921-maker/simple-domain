export const fmtINR = (n: number | string | null | undefined) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(
    Number(n ?? 0),
  );

// Indian numbering: number to words
const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
  'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n: number): string {
  if (n < 20) return ones[n];
  const t = Math.floor(n / 10);
  const r = n % 10;
  return tens[t] + (r ? ' ' + ones[r] : '');
}

function threeDigits(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  const parts: string[] = [];
  if (h) parts.push(ones[h] + ' Hundred');
  if (r) parts.push(twoDigits(r));
  return parts.join(' ');
}

export function numberToIndianWords(num: number): string {
  if (!isFinite(num)) return '';
  const sign = num < 0 ? 'Minus ' : '';
  num = Math.abs(num);
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  if (rupees === 0 && paise === 0) return 'Zero Rupees Only';

  let n = rupees;
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh = Math.floor(n / 100000); n %= 100000;
  const thousand = Math.floor(n / 1000); n %= 1000;
  const hundred = n;

  const parts: string[] = [];
  if (crore) parts.push(twoDigits(crore) + ' Crore');
  if (lakh) parts.push(twoDigits(lakh) + ' Lakh');
  if (thousand) parts.push(twoDigits(thousand) + ' Thousand');
  if (hundred) parts.push(threeDigits(hundred));

  let result = sign + parts.join(' ') + ' Rupees';
  if (paise) result += ' and ' + twoDigits(paise) + ' Paise';
  return result + ' Only';
}