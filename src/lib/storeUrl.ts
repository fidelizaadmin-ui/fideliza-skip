/**
 * Monta a URL pública individual da loja (/loja/:slug) a partir do domínio
 * em que o usuário está navegando no momento (window.location.origin).
 *
 * Assim, quando o app é acessado pela URL alternativa cadastrada no Alias
 * (domínio próprio), os links de divulgação exibidos/copiados no painel do
 * lojista usam esse mesmo domínio — nunca uma URL fixa do sistema.
 */
export function getStorePublicUrl(slug?: string | null): string {
  const safeSlug = (slug || '').trim() || 'loja'
  if (typeof window === 'undefined') {
    return `/loja/${safeSlug}`
  }
  return `${window.location.origin}/loja/${safeSlug}`
}

/**
 * Copia texto para a área de transferência com fallback:
 * em domínios servidos sem HTTPS (ex.: alias próprio sem certificado),
 * navigator.clipboard não existe — usa o método clássico execCommand.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* cai no fallback abaixo */
  }
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.top = '-1000px'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return ok
  } catch {
    return false
  }
}
