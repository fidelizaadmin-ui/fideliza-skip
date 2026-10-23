import React from 'react'

export interface LogoProps {
  /**
   * - 'full': Símbolo caixa de presente + Wordmark "Fideliza" vertical
   * - 'horizontal': Símbolo + Wordmark lado a lado
   * - 'symbol': Apenas o símbolo da caixa de presente com F azul
   * - 'badge': Símbolo com fundo suave
   */
  variant?: 'full' | 'horizontal' | 'symbol' | 'badge'
  theme?: 'dark' | 'light'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showTagline?: boolean
}

/**
 * Símbolo oficial Fideliza: Caixa de presentes na cor laranja vibrante
 * com laço/fita contrastante e a letra "F" em azul preenchendo a área frontal.
 */
/**
 * Padrão oficial de cores da marca Fideliza.
 * O "F" da caixa de presente e a palavra "Fideliza" compartilham a mesma
 * definição de cor por tema, garantindo consistência em toda a identidade visual.
 */
export const FIDELIZA_BRAND_COLORS = {
  light: {
    hex: '#0F172A', // slate-900
    tailwindClass: 'text-slate-900',
  },
  dark: {
    hex: '#FFFFFF', // white
    tailwindClass: 'text-white',
  },
} as const

export const LogoSymbol: React.FC<{
  size?: number | string
  className?: string
  theme?: 'dark' | 'light'
  fColor?: string
  withBackground?: boolean
}> = ({ size = 36, className = '', theme = 'light', fColor, withBackground = false }) => {
  const numericSize = typeof size === 'number' ? size : parseInt(String(size), 10) || 36
  const resolvedFColor = fColor || FIDELIZA_BRAND_COLORS[theme].hex

  const svgContent = (
    <svg
      width={numericSize}
      height={numericSize}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${!withBackground ? className : ''}`}
      aria-label="Símbolo Fideliza"
    >
      {/* Bow loops (laço superior) */}
      <path d="M32 17.5 C23 8 12 9 14 16.5 C15.5 21 24 19 32 18 Z" fill="#EA580C" />
      <path d="M32 17.5 C41 8 52 9 50 16.5 C48.5 21 40 19 32 18 Z" fill="#EA580C" />
      {/* Ribbon tails (pontas do laço) */}
      <path d="M30 18.5 L26 23 L28.5 23 L31.5 19.5 Z" fill="#C2410C" />
      <path d="M34 18.5 L38 23 L35.5 23 L32.5 19.5 Z" fill="#C2410C" />
      {/* Bow knot (nó do laço) */}
      <ellipse cx="32" cy="18" rx="4" ry="3.2" fill="#C2410C" />

      {/* Box lid (tampa da caixa) */}
      <rect
        x="8"
        y="18"
        width="48"
        height="9"
        rx="3"
        fill="#F97316"
        stroke="#EA580C"
        strokeWidth="1"
      />
      {/* Lid center ribbon segment */}
      <rect x="29" y="18" width="6" height="9" fill="#EA580C" />

      {/* Box body (corpo da caixa de presente) */}
      <rect
        x="11"
        y="26"
        width="42"
        height="33"
        rx="5"
        fill="#F97316"
        stroke="#EA580C"
        strokeWidth="1"
      />

      {/* Letra 'F' na caixa seguindo exatamente a cor da palavra Fideliza */}
      <path
        d="M19 30.5 C19 29.7 19.7 29 20.5 29 H44.5 C45.3 29 46 29.7 46 30.5 V34.5 C46 35.3 45.3 36 44.5 36 H27 V40 H40.5 C41.3 40 42 40.7 42 41.5 V45 C42 45.8 41.3 46.5 40.5 46.5 H27 V54.5 C27 55.3 26.3 56 25.5 56 H20.5 C19.7 56 19 55.3 19 54.5 Z"
        fill={resolvedFColor}
      />
    </svg>
  )

  if (withBackground) {
    return (
      <div
        style={{ width: numericSize * 1.25, height: numericSize * 1.25 }}
        className={`rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-800/40 flex items-center justify-center shrink-0 shadow-xs ${className}`}
        aria-label="Símbolo Fideliza"
      >
        {svgContent}
      </div>
    )
  }

  return svgContent
}

/**
 * Wordmark neutro "Fideliza" com tipografia moderna
 */
export const LogoWordmark: React.FC<{
  height?: number
  className?: string
  theme?: 'dark' | 'light'
}> = ({ className = '', theme = 'light' }) => {
  const textColor = FIDELIZA_BRAND_COLORS[theme].tailwindClass

  return (
    <span
      className={`font-black tracking-tight ${textColor} ${className}`}
      style={{ letterSpacing: '-0.03em' }}
    >
      Fideliza
    </span>
  )
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'horizontal',
  theme = 'light',
  size = 'md',
  className = '',
  showTagline = false,
}) => {
  const isDark = theme === 'dark'
  const textColor = FIDELIZA_BRAND_COLORS[theme].tailwindClass
  const subtitleColor = isDark ? 'text-slate-400' : 'text-slate-500'

  const dimensions = {
    sm: { symbolSize: 28, textClass: 'text-lg', subtitle: 'text-[9px]' },
    md: { symbolSize: 36, textClass: 'text-xl', subtitle: 'text-[10px]' },
    lg: { symbolSize: 48, textClass: 'text-2xl', subtitle: 'text-xs' },
    xl: { symbolSize: 60, textClass: 'text-3xl', subtitle: 'text-xs sm:text-sm' },
  }[size]

  if (variant === 'symbol') {
    return <LogoSymbol size={dimensions.symbolSize} theme={theme} className={className} />
  }

  if (variant === 'badge') {
    return (
      <LogoSymbol
        size={dimensions.symbolSize}
        theme={theme}
        withBackground={true}
        className={className}
      />
    )
  }

  if (variant === 'full') {
    return (
      <div className={`flex flex-col items-center text-center gap-2 select-none ${className}`}>
        <LogoSymbol size={dimensions.symbolSize * 1.25} theme={theme} />
        <div className="flex flex-col items-center leading-tight">
          <span
            className={`font-black tracking-tight ${dimensions.textClass} ${textColor}`}
            style={{ letterSpacing: '-0.03em' }}
          >
            Fideliza
          </span>
          <span
            className={`font-semibold uppercase tracking-wider mt-0.5 ${
              showTagline ? 'text-orange-500' : subtitleColor
            } ${dimensions.subtitle}`}
          >
            Programa de Fidelidade
          </span>
        </div>
      </div>
    )
  }

  // Horizontal (default): Símbolo + Texto lado a lado
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <LogoSymbol size={dimensions.symbolSize} theme={theme} />
      <div className="flex flex-col justify-center leading-none">
        <span
          className={`font-black tracking-tight ${dimensions.textClass} ${textColor}`}
          style={{ letterSpacing: '-0.03em' }}
        >
          Fideliza
        </span>
        {showTagline && (
          <span
            className={`font-semibold uppercase tracking-wider mt-0.5 ${subtitleColor} ${dimensions.subtitle}`}
          >
            Programa de Fidelidade
          </span>
        )}
      </div>
    </div>
  )
}

export default Logo
