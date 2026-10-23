import React from 'react'

export interface LogoProps {
  /**
   * - 'full': Símbolo + Wordmark "Fideliza" + Tagline "FIDELIDADE QUE PREMIA"
   * - 'horizontal': Símbolo + Wordmark "Fideliza" (com ou sem tagline em formato compacto)
   * - 'symbol': Apenas o símbolo (Presente + F + Estrela)
   * - 'badge': Símbolo emoldurado no fundo azul-marinho oficial
   */
  variant?: 'full' | 'horizontal' | 'symbol' | 'badge'
  /**
   * - 'dark': Para fundos escuros (azul-marinho / preto): Fideliza branco, caixa branca, fita amarela, estrela amarela
   * - 'light': Para fundos claros (branco / cinza): Fideliza azul-marinho, caixa azul-marinho escuro, fita amarela, estrela amarela
   */
  theme?: 'dark' | 'light'
  /**
   * Tamanho / altura aproximada
   */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /**
   * Classes extras
   */
  className?: string
  /**
   * Se exibe a tagline no modo horizontal
   */
  showTagline?: boolean
}

// Cores oficiais extraídas da referência:
// Amarelo primário da fita, laço, estrela e pontos dos 'i': #FFC72C / #FFBE1A
// Amarelo escuro / sombra fita: #E5A800
// Azul-marinho oficial: #0D2240 (fundo profundo) / #0A192F / #12294D
// Branco oficial: #FFFFFF

/**
 * Símbolo vetorial fiel à imagem de referência:
 * - Caixa de presente amarela com laço fofo de 2 orelhas e nó central
 * - Tampa saliente com divisão sutil
 * - Letra "F" branca estilizada em itálico e cantos arredondados sobreposta à frente da caixa
 * - Fita amarela vertical no centro da tampa
 * - Estrelinha amarela de 5 pontas abaixo da perna do F
 */
export const LogoSymbol: React.FC<{
  size?: number | string
  className?: string
  theme?: 'dark' | 'light'
  withBackground?: boolean
}> = ({ size = 48, className = '', theme = 'dark', withBackground = false }) => {
  const isLight = theme === 'light'
  const letterColor = isLight ? '#0D2240' : '#FFFFFF'
  const giftColor = '#FFC400'
  const giftRibbon = '#FFB300'
  const starColor = '#FFC400'

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-label="Fideliza Símbolo"
    >
      {withBackground && <rect width="100" height="100" rx="22" fill="#0D2240" />}

      {/* LAÇO SUPERIOR (Duas alças arredondadas e nó central) */}
      <g id="gift-bow">
        {/* Alça esquerda do laço */}
        <path
          d="M48 24C41 14 26 14 24 23C22 30 35 34 46 32"
          fill="none"
          stroke={giftColor}
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Alça direita do laço */}
        <path
          d="M52 24C59 14 74 14 76 23C78 30 65 34 54 32"
          fill="none"
          stroke={giftColor}
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Nó central do laço */}
        <circle cx="50" cy="27" r="3.2" fill={giftColor} />
      </g>

      {/* TAMPA DO PRESENTE (cantos arredondados, barra horizontal amarela) */}
      <rect x="18" y="30" width="64" height="12" rx="5" fill={giftColor} />
      {/* Fita vertical central na tampa (ligeiramente mais escura) */}
      <rect x="45.5" y="30" width="9" height="12" fill={giftRibbon} />

      {/* CORPO DA CAIXA DE PRESENTE (abaixo da tampa) */}
      <path
        d="M23 42H77L74 72C73.8 74.2 72 76 69.8 76H30.2C28 76 26.2 74.2 26 72L23 42Z"
        fill={giftColor}
      />
      {/* Fita vertical central no corpo */}
      <path d="M45.5 42H54.5V76H45.5V42Z" fill={giftRibbon} />

      {/* LETRA "F" ESTILIZADA (Itálica, dinâmica, sobreposta à caixa) */}
      {/* Efeito de recorte/sombra sutil em torno do F para destaque límpido */}
      <g id="stylized-f">
        {/* Haste inclinada do F */}
        <path
          d="M37 41L27.5 75C27 76.8 28.3 78.5 30.2 78.5H39C40.6 78.5 42 77.3 42.4 75.7L45 65.5H57C58.7 65.5 60 64.2 60 62.5V59C60 57.3 58.7 56 57 56H47.4L49.6 47.5H68C69.7 47.5 71 46.2 71 44.5V41H37Z"
          fill={letterColor}
          stroke="#0D2240"
          strokeWidth={isLight ? '0' : '1.5'}
          strokeLinejoin="round"
        />
        {/* Barra superior com borda suave direita */}
        <path
          d="M37 41H68C70 41 71.5 42.5 71.5 44.5C71.5 46.5 70 48 68 48H49.5L46.8 58.5H57.5C59.5 58.5 61 60 61 62C61 64 59.5 65.5 57.5 65.5H45L42.2 76.5C41.7 78.5 39.8 80 37.8 80H29.5C26.5 80 24.3 77.2 25.1 74.3L33.5 43.5C34 42 35.4 41 37 41Z"
          fill={letterColor}
        />
      </g>

      {/* ESTRELA DE 5 PONTAS (amarela, à direita e abaixo do F) */}
      <g id="star" transform="translate(62, 67)">
        <polygon
          points="7,0 9.2,4.4 14,5.1 10.5,8.5 11.3,13.3 7,11 2.7,13.3 3.5,8.5 0,5.1 4.8,4.4"
          fill={starColor}
        />
      </g>
    </svg>
  )
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'horizontal',
  theme = 'light',
  size = 'md',
  className = '',
  showTagline = true,
}) => {
  const isDark = theme === 'dark'
  const textColor = isDark ? '#FFFFFF' : '#0D2240'
  const dotColor = '#FFC400'
  const taglineColor = '#FFC400'

  // Configurações de escala
  const dimensions = {
    sm: { symbolSize: 32, height: 36, textFideliza: 'text-lg', tagline: 'text-[7px]' },
    md: { symbolSize: 42, height: 46, textFideliza: 'text-2xl', tagline: 'text-[9px]' },
    lg: { symbolSize: 56, height: 60, textFideliza: 'text-3xl', tagline: 'text-[11px]' },
    xl: {
      symbolSize: 76,
      height: 82,
      textFideliza: 'text-4xl sm:text-5xl',
      tagline: 'text-xs sm:text-sm',
    },
  }[size]

  if (variant === 'symbol') {
    return <LogoSymbol size={dimensions.symbolSize} theme={theme} className={className} />
  }

  if (variant === 'badge') {
    return (
      <LogoSymbol size={dimensions.symbolSize} theme="dark" withBackground className={className} />
    )
  }

  // Wordmark estilizado em SVG para garantir renderização perfeita em qualquer browser
  const Wordmark = () => (
    <div className="flex flex-col justify-center leading-none select-none">
      <div className="flex items-baseline">
        <span
          className={`font-black tracking-tight ${dimensions.textFideliza}`}
          style={{ color: textColor, fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          F
          <span className="relative inline-block">
            <span className="text-transparent" style={{ WebkitTextStroke: '0px' }}>
              i
            </span>
            <span className="absolute left-0 bottom-0" style={{ color: textColor }}>
              ı
            </span>
            <span
              className="absolute left-[2px] -top-[3px] rounded-full"
              style={{
                width: size === 'sm' ? '3.5px' : size === 'lg' || size === 'xl' ? '6.5px' : '5px',
                height: size === 'sm' ? '3.5px' : size === 'lg' || size === 'xl' ? '6.5px' : '5px',
                backgroundColor: dotColor,
              }}
            />
          </span>
          del
          <span className="relative inline-block">
            <span className="text-transparent">i</span>
            <span className="absolute left-0 bottom-0" style={{ color: textColor }}>
              ı
            </span>
            <span
              className="absolute left-[2px] -top-[3px] rounded-full"
              style={{
                width: size === 'sm' ? '3.5px' : size === 'lg' || size === 'xl' ? '6.5px' : '5px',
                height: size === 'sm' ? '3.5px' : size === 'lg' || size === 'xl' ? '6.5px' : '5px',
                backgroundColor: dotColor,
              }}
            />
          </span>
          za
        </span>
      </div>

      {(variant === 'full' || showTagline) && (
        <span
          className={`font-black uppercase tracking-[0.22em] mt-0.5 ${dimensions.tagline}`}
          style={{ color: taglineColor }}
        >
          Fidelidade que premia
        </span>
      )}
    </div>
  )

  // Variante COMPLETA (Vertical / Hero / Login / Branding)
  if (variant === 'full') {
    return (
      <div className={`flex flex-col items-center text-center gap-2 ${className}`}>
        <LogoSymbol size={dimensions.symbolSize * 1.3} theme={theme} withBackground={false} />
        <div className="flex flex-col items-center">
          <div className="flex items-baseline">
            <span
              className={`font-black tracking-tight ${dimensions.textFideliza}`}
              style={{ color: textColor, fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              F
              <span className="relative inline-block">
                <span className="text-transparent">i</span>
                <span className="absolute left-0 bottom-0" style={{ color: textColor }}>
                  ı
                </span>
                <span
                  className="absolute left-[2.5px] -top-[4px] rounded-full shadow-xs"
                  style={{
                    width: size === 'sm' ? '4px' : size === 'xl' ? '8px' : '6px',
                    height: size === 'sm' ? '4px' : size === 'xl' ? '8px' : '6px',
                    backgroundColor: dotColor,
                  }}
                />
              </span>
              del
              <span className="relative inline-block">
                <span className="text-transparent">i</span>
                <span className="absolute left-0 bottom-0" style={{ color: textColor }}>
                  ı
                </span>
                <span
                  className="absolute left-[2.5px] -top-[4px] rounded-full shadow-xs"
                  style={{
                    width: size === 'sm' ? '4px' : size === 'xl' ? '8px' : '6px',
                    height: size === 'sm' ? '4px' : size === 'xl' ? '8px' : '6px',
                    backgroundColor: dotColor,
                  }}
                />
              </span>
              za
            </span>
          </div>
          <span
            className={`font-black uppercase tracking-[0.26em] mt-1 ${dimensions.tagline}`}
            style={{ color: taglineColor }}
          >
            Fidelidade que premia
          </span>
        </div>
      </div>
    )
  }

  // Variante HORIZONTAL (Padrão para Navbar, Footer e headers)
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <LogoSymbol size={dimensions.symbolSize} theme={theme} />
      <Wordmark />
    </div>
  )
}

export default Logo
