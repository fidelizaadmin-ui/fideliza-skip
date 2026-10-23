import React from 'react'

export interface LogoProps {
  /**
   * - 'full': Símbolo oficial + Wordmark "Fideliza" vertical (empilhado)
   * - 'horizontal': Símbolo oficial + Wordmark "Fideliza" lado a lado
   * - 'symbol': Apenas o símbolo oficial (emblema com laço + estrela)
   * - 'badge': Símbolo com fundo suave arredondado
   */
  variant?: 'full' | 'horizontal' | 'symbol' | 'badge'
  theme?: 'dark' | 'light'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showTagline?: boolean
}

/**
 * Caminhos SVG do Símbolo da marca extraídos fielmente do arquivo "fideliza logo-9dba6.svg"
 * ViewBox do símbolo: 0 0 215 375
 */
const SYMBOL_PATHS = {
  // Emblema principal: forma com laço/nó no topo e corpo
  emblem:
    'M1479 3720 c57 -28 117 -103 165 -204 l42 -88 42 86 c49 103 124 187 188 212 104 40 211 -2 259 -101 34 -69 31 -124 -12 -193 l-29 -47 -122 0 c-67 0 -118 2 -114 5 4 3 25 12 47 19 59 19 103 52 121 89 18 39 12 64 -23 92 -68 53 -158 1 -244 -143 -36 -61 -33 -60 -137 -61 l-53 -1 -31 55 c-84 151 -171 205 -242 149 -20 -16 -26 -29 -26 -61 0 -49 37 -88 108 -114 73 -27 70 -31 -24 -33 -128 -2 -151 4 -181 50 -68 103 -18 251 98 298 42 17 127 12 168 -9z m139 -517 l3 -123 -93 0 c-51 0 -110 -5 -131 -11 -48 -13 -113 -70 -126 -112 -6 -18 -49 -192 -96 -387 -47 -195 -88 -362 -91 -370 -4 -11 -10 -7 -22 15 -15 26 -17 77 -20 403 -2 265 -6 372 -14 372 -6 0 -20 7 -30 17 -15 14 -18 32 -18 125 0 121 11 157 58 182 22 13 74 15 302 13 l275 -2 3 -122z m739 94 c26 -25 28 -34 31 -122 l4 -95 -321 0 -321 0 0 118 c0 65 3 122 7 126 4 4 134 6 290 4 l283 -3 27 -28z m-2448 -301 l0 -295 -74 -3 c-53 -2 -77 1 -82 10 -10 15 -12 548 -3 573 5 13 20 15 83 13 l76 -3 0 -295z m-1199 233 c-48 -167 -56 -182 -113 -212 -14 -7 -114 -11 -302 -11 -190 0 -282 -3 -286 -11 -8 -12 -34 -117 -35 -136 0 -10 54 -13 236 -13 l236 0 -7 -32 c-11 -52 -36 -120 -53 -145 -33 -51 -62 -58 -277 -63 l-199 -5 -32 -124 c-27 -107 -36 -129 -63 -153 -30 -27 -36 -28 -131 -28 -55 0 -100 2 -100 5 0 3 18 77 39 163 22 86 67 274 101 417 71 300 73 307 112 340 l30 25 424 0 c400 0 425 -1 420 -17z',
  // Estrela no canto inferior do emblema
  star: 'M1078 1272 l20 -53 57 -6 c31 -4 60 -9 63 -13 3 -3 -13 -23 -37 -44 l-43 -38 12 -63 c7 -35 11 -65 9 -67 -3 -2 -28 11 -58 30 l-54 34 -53 -36 c-29 -19 -56 -33 -58 -30 -3 3 2 33 11 67 l15 62 -47 42 c-46 40 -47 42 -23 48 13 4 41 7 62 8 35 1 39 4 64 56 15 30 30 55 34 55 3 0 15 -24 26 -52z',
}

/**
 * Wordmark "Fideliza" extraído fielmente do SVG original (sem o símbolo e sem a tagline inferior)
 * ViewBox: 260 170 380 180 (ou normalizado 0 0 380 180 com translate -265, 345)
 */
const WORDMARK_PATHS = [
  // Letra F (maiúscula)
  'M3095 3217 l0 -70 -165 -5 -165 -5 0 -104 0 -103 127 1 c161 2 168 -1 168 -79 0 -48 -4 -61 -19 -70 -11 -5 -78 -10 -150 -10 l-131 0 -2 -162 -3 -163 -80 0 -80 0 -3 409 c-2 296 1 412 9 423 10 11 57 13 253 11 l241 -3 0 -70z',
  // Pingo do primeiro i
  'M3320 3272 c29 -29 27 -94 -5 -125 -77 -78 -192 32 -124 119 27 34 98 37 129 6z',
  // Corpo do primeiro i
  'M4923 2736 c17 -5 18 -23 18 -305 l0 -300 -77 3 -78 3 -3 290 c-2 247 0 292 13 301 16 12 98 18 127 8z',
  // Letra d (haste + corpo)
  'M4035 3270 c3 -13 4 -203 3 -423 l-3 -400 -69 -3 c-74 -3 -86 3 -86 47 0 23 0 23 -36 -9 -48 -42 -76 -51 -152 -52 -160 -1 -272 125 -272 306 0 172 79 283 224 316 68 15 146 -2 192 -42 l34 -30 0 144 c0 99 4 148 12 156 7 7 40 12 80 12 62 0 68 -2 73 -22z',
  'M3783 2890 c-94 -57 -95 -243 -1 -300 69 -42 168 -17 205 52 23 44 24 151 0 195 -36 68 -137 95 -204 53z',
  // Letra e
  'M4484 2916 c-39 -17 -74 -61 -74 -92 0 -24 0 -24 125 -24 l125 0 0 25 c0 15 -14 40 -33 61 -37 41 -93 53 -143 30z',
  'M4226 2709 c95 -42 152 -128 163 -246 9 -98 16 -95 -218 -95 l-198 0 9 -31 c27 -93 133 -125 237 -73 l52 27 36 -28 c53 -40 55 -53 11 -91 -50 -43 -114 -64 -196 -64 -182 0 -295 103 -308 282 -9 129 54 260 149 308 84 43 182 47 263 11z',
  // Letra l
  'M4918 2943 c1 -224 6 -349 13 -357 6 -7 23 -14 37 -16 25 -3 27 -7 30 -60 3 -50 0 -58 -19 -69 -32 -16 -124 -6 -157 18 -61 44 -62 52 -62 454 0 201 3 369 7 373 4 4 39 5 78 4 l70 -3 3 -344z',
  // Pingo do segundo i
  'M5215 3267 c61 -60 1 -159 -84 -140 -59 13 -81 87 -40 139 28 36 89 37 124 1z',
  // Letra z
  'M5494 2733 c4 0 7 -26 7 -57 l0 -56 -117 -155 c-65 -85 -124 -163 -132 -173 -13 -20 -10 -20 103 -20 65 0 126 -5 137 -10 14 -8 19 -21 19 -55 0 -80 16 -75 -246 -75 l-234 0 0 55 c0 53 2 58 88 172 136 183 172 232 172 237 0 3 -57 7 -127 8 l-128 3 -3 55 c-2 41 1 57 13 66 11 8 78 11 228 9 117 -1 215 -3 220 -4z',
  // Letra a
  'M6225 2704 c-50 -12 -74 -28 -86 -56 -26 -62 21 -114 94 -103 71 10 107 51 107 120 0 28 -4 35 -19 35 -10 0 -31 2 -47 4 -16 2 -38 2 -49 0z',
  'M5926 2717 c50 -14 118 -82 133 -134 7 -23 13 -131 15 -250 l3 -210 -68 -3 c-67 -3 -68 -3 -78 27 l-11 31 -45 -32 c-37 -27 -55 -33 -113 -36 -87 -5 -130 9 -174 58 -58 64 -58 170 -1 238 43 52 116 75 229 75 l98 0 -6 36 c-12 81 -104 106 -202 56 -27 -14 -54 -25 -60 -25 -19 0 -65 75 -58 94 9 23 87 67 148 82 54 14 125 11 190 -7z',
]

/**
 * Símbolo oficial extraído do SVG (emblema com laço + estrela)
 * Sem fundo, com preenchimento customizável via className / currentColor
 */
export const LogoSymbol: React.FC<{
  size?: number | string
  className?: string
  theme?: 'dark' | 'light'
  withBackground?: boolean
}> = ({ size = 36, className = '', theme = 'light', withBackground = false }) => {
  const numericSize = typeof size === 'number' ? size : parseInt(String(size), 10) || 36
  const primaryColor = theme === 'dark' ? 'text-rose-400' : 'text-rose-600'

  if (withBackground) {
    return (
      <div
        style={{ width: numericSize, height: numericSize }}
        className={`rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/40 flex items-center justify-center shrink-0 shadow-xs p-1.5 ${className}`}
        aria-label="Símbolo Fideliza"
      >
        <svg
          viewBox="0 0 215 375"
          className={`w-full h-full ${primaryColor}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g transform="translate(-8, 375) scale(0.1, -0.1)" fill="currentColor">
            <path d={SYMBOL_PATHS.emblem} />
            <path d={SYMBOL_PATHS.star} />
          </g>
        </svg>
      </div>
    )
  }

  return (
    <div
      style={{ width: numericSize, height: numericSize }}
      className={`flex items-center justify-center shrink-0 ${className}`}
      aria-label="Símbolo Fideliza"
    >
      <svg
        viewBox="0 0 215 375"
        className={`w-full h-full ${primaryColor}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g transform="translate(-8, 375) scale(0.1, -0.1)" fill="currentColor">
          <path d={SYMBOL_PATHS.emblem} />
          <path d={SYMBOL_PATHS.star} />
        </g>
      </svg>
    </div>
  )
}

/**
 * Wordmark oficial "Fideliza" extraído do SVG do usuário.
 */
export const LogoWordmark: React.FC<{
  height?: number
  className?: string
  theme?: 'dark' | 'light'
}> = ({ height = 24, className = '', theme = 'light' }) => {
  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'

  return (
    <svg
      viewBox="0 0 380 180"
      style={{ height, width: 'auto', display: 'inline-block' }}
      className={`${textColor} ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Fideliza"
    >
      <g transform="translate(-265, 345) scale(0.1, -0.1)" fill="currentColor">
        {WORDMARK_PATHS.map((d, index) => (
          <path key={index} d={d} />
        ))}
      </g>
    </svg>
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
  const subtitleColor = isDark ? 'text-slate-300' : 'text-slate-500'

  const dimensions = {
    sm: { symbolSize: 26, wordmarkHeight: 18, subtitle: 'text-[9px]' },
    md: { symbolSize: 34, wordmarkHeight: 24, subtitle: 'text-[10px]' },
    lg: { symbolSize: 48, wordmarkHeight: 32, subtitle: 'text-xs' },
    xl: { symbolSize: 64, wordmarkHeight: 44, subtitle: 'text-xs sm:text-sm' },
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
          <LogoWordmark height={dimensions.wordmarkHeight * 1.15} theme={theme} />
          {showTagline && (
            <span
              className={`font-semibold uppercase tracking-wider mt-1 text-rose-500 ${dimensions.subtitle}`}
            >
              Programa de Fidelidade
            </span>
          )}
        </div>
      </div>
    )
  }

  // Horizontal (default): Símbolo + Wordmark lado a lado
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <LogoSymbol size={dimensions.symbolSize} theme={theme} />
      <div className="flex flex-col justify-center leading-none">
        <LogoWordmark height={dimensions.wordmarkHeight} theme={theme} />
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
