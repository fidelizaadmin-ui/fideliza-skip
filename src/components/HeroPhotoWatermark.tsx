import React from 'react'
import watermarkImg from '@/assets/fundo-a97b9.png'

/**
 * Marca d'água fotográfica da seção hero da página inicial.
 *
 * Foto do lojista atrás do balcão com o smartphone exibindo o e-commerce
 * (ícones de loja, carrinho e caminhão conectados), renderizada atrás do
 * conteúdo do hero sobre o fundo azul escuro (slate-950).
 *
 * A foto é colorida/fotográfica, por isso aparece com opacidade baixa
 * (≈15–20%) e recebe um overlay do próprio azul escuro do fundo por cima,
 * garantindo que o tom navy predomine e que títulos, texto e botões
 * continuem legíveis. `object-cover` mantém o preenchimento responsivo em
 * qualquer largura de tela, sem distorcer a imagem.
 */
export const HeroPhotoWatermark: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
    >
      <img
        src={watermarkImg}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center opacity-[0.14] sm:opacity-20"
      />
      {/* Overlay azul escuro: devolve o tom navy do fundo e protege a legibilidade */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/55 to-slate-950/85" />
    </div>
  )
}

export default HeroPhotoWatermark
