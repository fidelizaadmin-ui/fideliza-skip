import React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

/**
 * Renderiza o botão MENU dentro do slot da barra superior (Navbar), à esquerda
 * das ações do usuário. Quando o slot não existe (ex.: navbar desmontada por
 * algum motivo), cai no modo "barra local" para o botão continuar acessível.
 */
export const NavbarSlotPortal: React.FC<{
  slotEl: HTMLElement | null
  missing: boolean
  children: React.ReactNode
  fallbackClassName?: string
}> = ({ slotEl, missing, children, fallbackClassName }) => {
  if (slotEl) return createPortal(children, slotEl)
  if (missing) {
    // Fallback raro: navbar sem slot — mantém o botão visível acima do conteúdo
    return (
      <div
        className={cn(
          'fixed top-[4.5rem] left-3 z-40 pointer-events-auto md:hidden',
          fallbackClassName,
        )}
      >
        {children}
      </div>
    )
  }
  return null
}
