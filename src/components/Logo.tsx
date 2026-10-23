import React from 'react'
import { Sparkles } from 'lucide-react'

export interface LogoProps {
  /**
   * - 'full': Símbolo com gradiente rose-amber + Wordmark "Fideliza" vertical
   * - 'horizontal': Símbolo + Wordmark lado a lado
   * - 'symbol': Apenas o símbolo com ícone Sparkles
   * - 'badge': Símbolo com fundo suave
   */
  variant?: 'full' | 'horizontal' | 'symbol' | 'badge'
  theme?: 'dark' | 'light'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showTagline?: boolean
}

/**
 * Símbolo oficial neutro: gradiente rose-amber com ícone Sparkles
 */
export const LogoSymbol: React.FC<{
  size?: number | string
  className?: string
  theme?: 'dark' | 'light'
  withBackground?: boolean
}> = ({ size = 36, className = '', theme = 'light', withBackground = false }) => {
  const numericSize = typeof size === 'number' ? size : parseInt(String(size), 10) || 36
  const iconSize = Math.max(14, Math.round(numericSize * 0.55))

  if (withBackground) {
    return (
      <div
        style={{ width: numericSize, height: numericSize }}
        className={`rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/40 flex items-center justify-center shrink-0 shadow-xs text-rose-600 ${className}`}
        aria-label="Símbolo Fideliza"
      >
        <Sparkles style={{ width: iconSize, height: iconSize }} />
      </div>
    )
  }

  return (
    <div
      style={{ width: numericSize, height: numericSize }}
      className={`rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20 ${className}`}
      aria-label="Símbolo Fideliza"
    >
      <Sparkles style={{ width: iconSize, height: iconSize }} />
    </div>
  )
}

/**
 * Wordmark neutro "Fideliza" com tipografia moderna
 */
export const LogoWordmark: React.FC<{
  height?: number
  className?: string
  theme?: 'dark' | 'light'
}> = ({ className = '', theme = 'light' }) => {
  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'

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
  const textColor = isDark ? 'text-white' : 'text-slate-900'
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
              showTagline ? 'text-rose-500' : subtitleColor
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
