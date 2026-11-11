import React from 'react'
import { useSystemSettings } from '@/contexts/SystemSettingsContext'
import { LogoSymbol } from '@/components/Logo'

/**
 * Componente de marca que usa o NOME do sistema configurado pelo admin
 * (não o SVG "Fideliza" fixo), herdando a cor do tema ativo.
 * Se o admin enviou uma logo, ela substitui a marca inteira; se enviou um
 * ícone, ele substitui o símbolo (caixa de presente). Sem uploads, mantém o padrão.
 */
export const BrandLogo: React.FC<{
  theme?: 'dark' | 'light'
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showTagline?: boolean
}> = ({ theme = 'light', className = '', size = 'md', showTagline = false }) => {
  const { systemName, logoUrl, iconUrl } = useSystemSettings()
  const isDark = theme === 'dark'

  const sizeConfig = {
    sm: { symbolSize: 30, logoHeight: 36, text: 'text-lg' },
    md: { symbolSize: 38, logoHeight: 44, text: 'text-2xl' },
    lg: { symbolSize: 46, logoHeight: 52, text: 'text-3xl' },
    xl: { symbolSize: 56, logoHeight: 64, text: 'text-4xl' },
  }[size]

  if (logoUrl) {
    return (
      <div className={`inline-flex items-center select-none ${className}`}>
        <img
          src={logoUrl}
          alt={systemName}
          style={{ height: sizeConfig.logoHeight, width: 'auto', maxWidth: 260 }}
          className="object-contain"
        />
      </div>
    )
  }

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {iconUrl ? (
        <img
          src={iconUrl}
          alt=""
          width={sizeConfig.symbolSize}
          height={sizeConfig.symbolSize}
          style={{ width: sizeConfig.symbolSize, height: sizeConfig.symbolSize }}
          className="object-contain rounded-xl"
        />
      ) : (
        /* Símbolo original da marca (favicon/símbolo não muda) */
        <LogoSymbol size={sizeConfig.symbolSize} theme={theme} />
      )}

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
