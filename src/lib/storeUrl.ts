/**
 * Monta a URL pública individual da loja (/:slug) a partir do domínio
 * em que o usuário está navegando no momento (window.location.origin).
 *
 * O link individual é o domínio seguido diretamente do slug escolhido pelo
 * lojista (ex.: https://dominio/minha-loja). Assim, quando o app é acessado
 * pela URL alternativa cadastrada no Alias (domínio próprio), os links de
 * divulgação exibidos/copiados no painel do lojista usam esse mesmo domínio —
 * nunca uma URL fixa do sistema.
 */
export function getStorePublicUrl(slug?: string | null): string {
  const safeSlug = (slug || '').trim()
  if (typeof window === 'undefined') {
    return `/${safeSlug}`
  }
  return `${window.location.origin}/${safeSlug}`
}

/**
 * Primeiros segmentos de caminho reservados às rotas fixas do sistema.
 * Um lojista não pode escolher um slug igual a nenhum deles, senão a rota
 * fixa (que tem precedência sobre a rota dinâmica /:slug) esconderia a loja.
 */
export const RESERVED_STORE_SLUGS = [
  'loja',
  'lojas',
  'admin',
  'lojista',
  'cliente',
  'login',
  'cadastro',
  'planos',
  'como-funciona',
  'pagamento-retorno',
  'redefinir-senha',
  'confirmar-email',
  'portal',
  'api',
  'assets',
] as const

export function isReservedStoreSlug(slug: string): boolean {
  return RESERVED_STORE_SLUGS.includes(
    slug.trim().toLowerCase() as (typeof RESERVED_STORE_SLUGS)[number],
  )
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
