import React from 'react'
import { Sparkles } from 'lucide-react'

export interface LogoProps {
  /**
   * - 'full': Ícone + Nome "Fideliza" + Subtítulo neutro
   * - 'horizontal': Ícone + Nome "Fideliza"
   * - 'symbol': Apenas o ícone neutro de fidelidade
   * - 'badge': Ícone emoldurado
   */
  variant?: 'full' | 'horizontal' | 'symbol' | 'badge'
  theme?: 'dark' | 'light'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showTagline?: boolean
}

/**
 * Ícone simples e neutro do app Fideliza (sem a referência de presente/F/estrela/amarelo da v0.0.7)
 * Utiliza o gradiente nativo do sistema (Rose/Amber) com Sparkles ou monograma limpo.
 */
export const LogoSymbol: React.FC<{
  size?: number | string
  className?: string
  theme?: 'dark' | 'light'
  withBackground?: boolean
}> = ({ size = 36, className = '', theme = 'light', withBackground = false }) => {
  const numericSize = typeof size === 'number' ? size : parseInt(String(size), 10) || 36
  const iconSize = Math.max(16, Math.round(numericSize * 0.55))

  return (
    <div
      style={{ width: numericSize, height: numericSize }}
      className={`rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm ${
        withBackground ? 'ring-2 ring-rose-500/30' : ''
      } ${className}`}
      aria-label="Fideliza"
    >
      <Sparkles style={{ width: iconSize, height: iconSize }} className="text-white" />
    </div>
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
  const textColor = isDark ? 'text-white' : 'text-slate-900'
  const subtitleColor = isDark ? 'text-slate-300' : 'text-slate-500'

  const dimensions = {
    sm: { symbolSize: 28, text: 'text-lg', subtitle: 'text-[9px]' },
    md: { symbolSize: 34, text: 'text-xl', subtitle: 'text-[10px]' },
    lg: { symbolSize: 44, text: 'text-2xl', subtitle: 'text-xs' },
    xl: { symbolSize: 56, text: 'text-3xl sm:text-4xl', subtitle: 'text-xs sm:text-sm' },
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
        <LogoSymbol size={dimensions.symbolSize * 1.3} theme={theme} />
        <div className="flex flex-col items-center leading-tight">
          <span className={`font-black tracking-tight ${textColor} ${dimensions.text}`}>
            Fideliza
          </span>
          <span
            className={`font-semibold uppercase tracking-wider mt-0.5 text-rose-500 ${dimensions.subtitle}`}
          >
            Programa de Fidelidade
          </span>
        </div>
      </div>
    )
  }

  // Horizontal (default)
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <LogoSymbol size={dimensions.symbolSize} theme={theme} />
      <div className="flex flex-col leading-none">
        <span className={`font-black tracking-tight ${textColor} ${dimensions.text}`}>
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
