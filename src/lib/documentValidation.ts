/**
 * Utilities for formatting and validating Brazilian CPF and CNPJ documents.
 */

export function cleanDocument(value: string): string {
  return value.replace(/\D/g, '')
}

export function formatCPF(digits: string): string {
  const d = digits.slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`
}

export function formatCNPJ(digits: string): string {
  const d = digits.slice(0, 14)
  if (d.length <= 2) return d
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`
}

export function formatDocument(value: string, role?: 'customer' | 'merchant' | 'admin'): string {
  const clean = cleanDocument(value)
  if (role === 'customer') {
    return formatCPF(clean)
  }
  if (role === 'merchant') {
    return formatCNPJ(clean)
  }
  // Auto-detect based on length
  if (clean.length > 11) {
    return formatCNPJ(clean)
  }
  return formatCPF(clean)
}

/**
 * Retorna o documento formatado com prefixo CPF ou CNPJ.
 */
export function formatDocumentWithLabel(value?: string): string {
  if (!value) return '-'
  const clean = cleanDocument(value)
  if (!clean) return '-'
  if (clean.length === 11) {
    return `CPF: ${formatCPF(clean)}`
  }
  if (clean.length === 14) {
    return `CNPJ: ${formatCNPJ(clean)}`
  }
  if (clean.length > 11) {
    return `CNPJ: ${formatCNPJ(clean)}`
  }
  return `CPF: ${formatCPF(clean)}`
}

/**
 * Formata telefone brasileiro com máscara padrão (00) 00000-0000 ou (00) 0000-0000.
 */
export function formatPhoneNumber(phone?: string): string {
  if (!phone) return '-'
  const digits = phone.replace(/\D/g, '')
  if (!digits) return '-'
  // Remove código de país 55 se vier com 12 ou 13 dígitos
  const cleanDigits =
    (digits.length === 12 || digits.length === 13) && digits.startsWith('55')
      ? digits.slice(2)
      : digits

  if (cleanDigits.length === 11) {
    return `(${cleanDigits.slice(0, 2)}) ${cleanDigits.slice(2, 7)}-${cleanDigits.slice(7)}`
  }
  if (cleanDigits.length === 10) {
    return `(${cleanDigits.slice(0, 2)}) ${cleanDigits.slice(2, 6)}-${cleanDigits.slice(6)}`
  }
  if (cleanDigits.length === 9) {
    return `${cleanDigits.slice(0, 5)}-${cleanDigits.slice(5)}`
  }
  if (cleanDigits.length === 8) {
    return `${cleanDigits.slice(0, 4)}-${cleanDigits.slice(4)}`
  }
  return phone
}

export function validateCPF(cpf: string): boolean {
  const clean = cleanDocument(cpf)
  if (clean.length !== 11) return false

  // Reject all identical digits (e.g. 111.111.111-11)
  if (/^(\d)\1{10}$/.test(clean)) return false

  let sum = 0
  let remainder = 0

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(clean.substring(i - 1, i), 10) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(clean.substring(9, 10), 10)) return false

  sum = 0
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(clean.substring(i - 1, i), 10) * (12 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(clean.substring(10, 11), 10)) return false

  return true
}

export function validateCNPJ(cnpj: string): boolean {
  const clean = cleanDocument(cnpj)
  if (clean.length !== 14) return false

  // Reject all identical digits
  if (/^(\d)\1{13}$/.test(clean)) return false

  let length = clean.length - 2
  let numbers = clean.substring(0, length)
  const digits = clean.substring(length)
  let sum = 0
  let pos = length - 7

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i), 10) * pos--
    if (pos < 2) pos = 9
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(0), 10)) return false

  length = length + 1
  numbers = clean.substring(0, length)
  sum = 0
  pos = length - 7
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i), 10) * pos--
    if (pos < 2) pos = 9
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(1), 10)) return false

  return true
}
