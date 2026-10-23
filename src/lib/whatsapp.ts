/**
 * Utility functions for WhatsApp formatting and link generation.
 */

/**
 * Extracts digits and generates a standard wa.me link.
 * Accepts numbers with or without country code (defaults to +55 Brazil if 10 or 11 digits),
 * or direct WhatsApp URLs (wa.me/..., api.whatsapp.com/send?...).
 */
export function formatWhatsAppUrl(input?: string): string {
  if (!input) return ''
  const trimmed = input.trim()
  if (!trimmed) return ''

  // If already an absolute http/https URL pointing to wa.me or whatsapp.com
  if (/^https?:\/\/(wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com)/i.test(trimmed)) {
    return trimmed
  }

  // If user pasted "wa.me/..." without protocol
  if (/^(wa\.me|api\.whatsapp\.com)/i.test(trimmed)) {
    return `https://${trimmed}`
  }

  // Extract only digits
  const digits = trimmed.replace(/\D/g, '')
  if (!digits) return ''

  // If 10 or 11 digits (Brazilian DDD + phone, e.g. 11987654321), prepend 55
  if (digits.length === 10 || digits.length === 11) {
    return `https://wa.me/55${digits}`
  }

  // If 12 or 13 digits starting with 55
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
    return `https://wa.me/${digits}`
  }

  // Generic fallback with digits
  return `https://wa.me/${digits}`
}

/**
 * Formats a phone number for display if it's raw digits or partial
 */
export function formatWhatsAppDisplay(input?: string): string {
  if (!input) return ''
  const trimmed = input.trim()
  if (trimmed.startsWith('http') || trimmed.includes('wa.me')) {
    return trimmed
  }
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  if (digits.length === 13 && digits.startsWith('55')) {
    const local = digits.slice(2)
    return `+55 (${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`
  }
  return trimmed
}
