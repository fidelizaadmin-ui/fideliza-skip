import React from 'react'
import watermarkImg from '@/assets/fundo-a97b9.png'
import { useSystemSettings } from '@/contexts/SystemSettingsContext'

/**
 * Marca d'água fotográfica da seção hero da página inicial.
 *
 * Usa a imagem de fundo configurada pelo admin em Configurações do sistema
 * (campo hero_image de system_settings). Sem imagem configurada, mantém a
 * foto padrão do Fideliza: lojista atrás do balcão com o smartphone exibindo
 * o e-commerce (ícones de loja, carrinho e caminhão conectados).
 *
 * A imagem é renderizada com opacidade moderada (≈35–40%) e recebe um overlay
 * do próprio azul escuro do fundo por cima, garantindo que o tom navy
 * predomine e que títulos, texto e botões continuem legíveis — seja com a
 * foto padrão, seja com uma imagem personalizada. `object-cover` mantém o
 * preenchimento responsivo em qualquer largura de tela, sem distorcer.
 */
export const HeroPhotoWatermark: React.FC = () => {
  const { heroImageUrl } = useSystemSettings()
  const src = heroImageUrl ?? watermarkImg

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
    >
      <img
        src={src}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center opacity-[0.35] sm:opacity-40"
      />
      {/* Overlay azul escuro mais leve: deixa a foto aparecer, mantendo a legibilidade do texto */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/65 via-slate-900/40 to-slate-950/70" />
    </div>
  )
}

export default HeroPhotoWatermark
