import { useEffect, useState } from 'react'

const SLOT_ID = 'navbar-menu-slot'
const MAX_ATTEMPTS = 20
const RETRY_MS = 100

export interface NavbarMenuSlotState {
  /** Elemento do slot na navbar (null enquanto não encontrado) */
  slotEl: HTMLElement | null
  /** true quando o slot não existe mesmo após várias tentativas (navbar ausente) */
  missing: boolean
}

/**
 * Localiza o slot do botão MENU na barra superior (Navbar) para renderização
 * via portal. O Navbar cria o <div id="navbar-menu-slot">; os três painéis
 * (admin, lojista e cliente) portalizam o botão MENU para dentro dele, de
 * modo que o botão fique na barra superior, à esquerda das ações do usuário.
 */
export function useNavbarMenuSlot(enabled = true): NavbarMenuSlotState {
  const [slotEl, setSlotEl] = useState<HTMLElement | null>(null)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    if (!enabled) return
    let attempts = 0
    let timer: number | undefined
    let cancelled = false

    const find = () => {
      if (cancelled) return
      const el = document.getElementById(SLOT_ID)
      if (el) {
        setSlotEl(el)
        return
      }
      attempts += 1
      if (attempts >= MAX_ATTEMPTS) {
        setMissing(true)
        return
      }
      timer = window.setTimeout(find, RETRY_MS)
    }

    find()
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [enabled])

  return { slotEl, missing }
}
