import { useEffect, useLayoutEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/**
 * Componente global que garante que toda mudança de rota posicione a rolagem
 * da janela no topo da página (top: 0, left: 0).
 *
 * - Desativa a restauração automática do histórico do navegador (history.scrollRestoration = 'manual')
 *   para evitar que ao voltar/avançar ou trocar de rota o navegador empurre a visualização para o rodapé.
 * - Suporta tanto rotas padrão quanto links com hash (se houver hash específico ele rola até o elemento,
 *   caso contrário reseta para o topo absoluto).
 * - Usa scrollTo({ top: 0, left: 0, behavior: 'instant' }) e fallbacks para documentElement/body.
 */
export function ScrollToTop() {
  const { pathname, search, hash } = useLocation()
  const navType = useNavigationType()

  // Desativa a restauração nativa do navegador que pode lembrar o rodapé da página anterior
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      const previous = window.history.scrollRestoration
      window.history.scrollRestoration = 'manual'
      return () => {
        window.history.scrollRestoration = previous
      }
    }
  }, [])

  // Dispara imediatamente antes da renderização visual e confirma no frame seguinte
  useLayoutEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.replace('#', ''))
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
        return
      }
    }

    // Rolagem instantânea para o topo
    try {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant' as ScrollBehavior,
      })
    } catch {
      window.scrollTo(0, 0)
    }

    if (document.documentElement) {
      document.documentElement.scrollTop = 0
    }
    if (document.body) {
      document.body.scrollTop = 0
    }

    // Reforço via requestAnimationFrame para o caso de elementos dinâmicos montarem
    const rafId = requestAnimationFrame(() => {
      try {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'instant' as ScrollBehavior,
        })
      } catch {
        window.scrollTo(0, 0)
      }
      if (document.documentElement) document.documentElement.scrollTop = 0
      if (document.body) document.body.scrollTop = 0
    })

    return () => cancelAnimationFrame(rafId)
  }, [pathname, search, hash, navType])

  return null
}

export default ScrollToTop
