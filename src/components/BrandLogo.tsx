import React from 'react'
import { useSystemSettings } from '@/contexts/SystemSettingsContext'
import { LogoSymbol } from '@/components/Logo'

/**
 * Componente de logo textual que usa o NOME do sistema configurado pelo admin
 * (não o SVG "Fideliza" fixo), herdando a cor do tema ativo.
 * O símbolo (caixa de presente) permanece o original da marca.
 */
export const BrandLogo: React.FC<{
  theme?: 'dark' | 'light'
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showTagline?: boolean
}> = ({ theme = 'light', className = '', size = 'md', showTagline = false }) => {
  const { systemName } = useSystemSettings()
  const isDark = theme === 'dark'

  const sizeConfig = {
    sm: { symbolSize: 30, text: 'text-lg' },
    md: { symbolSize: 38, text: 'text-2xl' },
    lg: { symbolSize: 46, text: 'text-3xl' },
    xl: { symbolSize: 56, text: 'text-4xl' },
  }[size]

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Símbolo original da marca (favicon/símbolo não muda) */}
      <LogoSymbol size={sizeConfig.symbolSize} theme={theme} />

      <div className="flex flex-col justify-center leading-none">
        <span
          className={`font-black tracking-tight ${sizeConfig.text} ${
            isDark
              ? 'text-white'
              : 'bg-clip-text text-transparent bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)]'
          }`}
        >
          {systemName}
        </span>
        {showTagline && (
          <span
            className={`font-semibold uppercase tracking-wider mt-1 text-[9px] ${
              isDark ? 'text-slate-400' : 'text-[#F58634]'
            }`}
          >
            Programa de Fidelidade
          </span>
        )}
      </div>
    </div>
  )
}
