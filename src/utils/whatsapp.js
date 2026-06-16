export function normalizeWhatsAppNumber(input) {
  const digits = String(input || '').replace(/\D/g, '');
  if (!digits) return '';

  // Common Nigeria formats: 080..., +23480..., 23480...
  if (digits.length === 11 && digits.startsWith('0')) return `234${digits.slice(1)}`;
  if (digits.length === 13 && digits.startsWith('234')) return digits;

  // If user already entered an international-style number, keep as-is.
  // (wa.me expects country code without '+')
  return digits;
}

export function buildWhatsAppUrl(number, message) {
  const normalized = normalizeWhatsAppNumber(number);
  if (!normalized) return '';
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message || '')}`;
}

