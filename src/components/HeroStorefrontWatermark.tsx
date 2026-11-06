import React from 'react'

/**
 * Marca d'água decorativa da seção hero da página inicial.
 *
 * Ilustração flat (inline SVG) de um conjunto de vitrines/fachadas de comércio —
 * lojistas do Fideliza — em tons azulados e branco, renderizada em opacidade
 * muito baixa (5–10%) sobre o fundo azul escuro, sem prejudicar a leitura.
 *
 * A paleta segue a identidade da marca: azul marinho #012D76, azul médio
 * #0283FD e laranja #F58634 (o laranja do laço da caixa de presente), sempre
 * em brilho bem reduzido para funcionar como textura de fundo.
 *
 * Escondida em telas pequenas (hidden sm:block) para não competir com o
 * formulário de busca em mobile.
 */
export const HeroStorefrontWatermark: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden hidden sm:block select-none"
    >
      <svg
        viewBox="0 0 1440 620"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          {/* Tons azulados translúcidos: brilho baixo sobre o fundo escuro */}
          <linearGradient id="wm-glass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7dd3fc" stopOpacity="0.16" />
            <stop offset="1" stopColor="#0283FD" stopOpacity="0.07" />
          </linearGradient>
          <linearGradient id="wm-awning" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#0283FD" stopOpacity="0.16" />
            <stop offset="1" stopColor="#F58634" stopOpacity="0.10" />
          </linearGradient>
        </defs>

        {/* Linha de chão sutil */}
        <path d="M0 520 H1440" stroke="#93c5fd" strokeOpacity="0.08" strokeWidth="2" />
        <path d="M0 560 H1440" stroke="#93c5fd" strokeOpacity="0.05" strokeWidth="2" />

        {/* ===== Vitrine à esquerda ===== */}
        <g opacity="0.55">
          {/* Fachada */}
          <rect x="70" y="230" width="260" height="290" rx="10" fill="#0283FD" fillOpacity="0.07" />
          <rect
            x="70"
            y="230"
            width="260"
            height="290"
            rx="10"
            stroke="#93c5fd"
            strokeOpacity="0.14"
            strokeWidth="3"
          />
          {/* Toldo (listras azul/laranja) */}
          <g>
            <path d="M60 210 q140 -34 280 0 l-12 42 q-128 -28 -256 0 z" fill="url(#wm-awning)" />
            <path d="M96 200 v52" stroke="#93c5fd" strokeOpacity="0.10" strokeWidth="6" />
            <path d="M160 194 v60" stroke="#93c5fd" strokeOpacity="0.10" strokeWidth="6" />
            <path d="M224 192 v62" stroke="#93c5fd" strokeOpacity="0.10" strokeWidth="6" />
            <path d="M288 194 v60" stroke="#93c5fd" strokeOpacity="0.10" strokeWidth="6" />
          </g>
          {/* Janelões do vitrine */}
          <rect x="96" y="278" width="94" height="120" rx="6" fill="url(#wm-glass)" />
          <rect x="208" y="278" width="94" height="120" rx="6" fill="url(#wm-glass)" />
          {/* Porta */}
          <rect x="96" y="418" width="206" height="102" rx="6" fill="#0283FD" fillOpacity="0.06" />
          <rect
            x="96"
            y="418"
            width="206"
            height="102"
            rx="6"
            stroke="#93c5fd"
            strokeOpacity="0.10"
            strokeWidth="3"
          />
          <path d="M282 462 v50" stroke="#93c5fd" strokeOpacity="0.14" strokeWidth="4" />
          {/* Sacolas de compras na vitrine */}
          <g>
            <path d="M132 306 l26 -3 6 66 -26 3 z" fill="#F58634" fillOpacity="0.10" />
            <path
              d="M138 306 c2 -12 16 -12 18 -1"
              stroke="#93c5fd"
              strokeOpacity="0.16"
              strokeWidth="3"
              fill="none"
            />
            <path d="M176 310 l24 0 8 62 -24 0 z" fill="#0283FD" fillOpacity="0.12" />
            <path
              d="M182 310 c0 -13 14 -13 15 -1"
              stroke="#93c5fd"
              strokeOpacity="0.16"
              strokeWidth="3"
              fill="none"
            />
          </g>
          {/* Letreiro */}
          <rect x="140" y="244" width="120" height="14" rx="7" fill="#93c5fd" fillOpacity="0.10" />
        </g>

        {/* ===== Loja central com letreiro alto ===== */}
        <g opacity="0.5">
          <rect
            x="560"
            y="180"
            width="320"
            height="340"
            rx="12"
            fill="#0283FD"
            fillOpacity="0.06"
          />
          <rect
            x="560"
            y="180"
            width="320"
            height="340"
            rx="12"
            stroke="#93c5fd"
            strokeOpacity="0.13"
            strokeWidth="3"
          />
          {/* Letreiro no topo */}
          <rect x="600" y="204" width="240" height="46" rx="10" fill="#0283FD" fillOpacity="0.10" />
          <rect x="628" y="218" width="120" height="10" rx="5" fill="#93c5fd" fillOpacity="0.16" />
          <circle cx="790" cy="227" r="9" fill="#F58634" fillOpacity="0.16" />
          {/* Vitrine ampla */}
          <rect x="596" y="272" width="200" height="140" rx="8" fill="url(#wm-glass)" />
          {/* Manequins na vitrine */}
          <g
            stroke="#93c5fd"
            strokeOpacity="0.15"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          >
            <circle cx="648" cy="318" r="11" />
            <path d="M648 329 v52" />
            <path d="M632 348 h32" />
            <circle cx="744" cy="318" r="11" />
            <path d="M744 329 v52" />
            <path d="M728 348 h32" />
          </g>
          {/* Porta com degrau */}
          <rect x="816" y="290" width="52" height="230" rx="6" fill="#0283FD" fillOpacity="0.07" />
          <path d="M852 396 v56" stroke="#93c5fd" strokeOpacity="0.15" strokeWidth="4" />
          {/* Caixa registradora no balcão */}
          <g opacity="0.9">
            <rect
              x="600"
              y="446"
              width="200"
              height="74"
              rx="8"
              fill="#0283FD"
              fillOpacity="0.08"
            />
            <rect x="612" y="426" width="46" height="26" rx="4" fill="#F58634" fillOpacity="0.12" />
          </g>
        </g>

        {/* ===== Loja à direita (cafeteria) ===== */}
        <g opacity="0.5">
          <rect
            x="1110"
            y="250"
            width="270"
            height="270"
            rx="10"
            fill="#0283FD"
            fillOpacity="0.07"
          />
          <rect
            x="1110"
            y="250"
            width="270"
            height="270"
            rx="10"
            stroke="#93c5fd"
            strokeOpacity="0.13"
            strokeWidth="3"
          />
          {/* Toldo */}
          <path d="M1100 232 q145 -32 290 0 l-10 40 q-135 -26 -270 0 z" fill="url(#wm-awning)" />
          {/* Janela com xícaras */}
          <rect x="1138" y="300" width="110" height="100" rx="6" fill="url(#wm-glass)" />
          <g
            stroke="#93c5fd"
            strokeOpacity="0.14"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
          >
            <path d="M1174 340 h18 l-3 16 h-12 z" />
            <path d="M1192 344 c8 2 8 10 0 12" />
            <path d="M1180 330 c2 -5 -2 -7 0 -11" />
          </g>
          {/* Porta */}
          <rect x="1272" y="300" width="84" height="220" rx="6" fill="#0283FD" fillOpacity="0.06" />
          <path d="M1334 400 v44" stroke="#93c5fd" strokeOpacity="0.15" strokeWidth="4" />
          {/* Sacolas penduradas */}
          <g>
            <path d="M1210 428 l22 -2 5 56 -22 2 z" fill="#F58634" fillOpacity="0.10" />
            <path
              d="M1216 428 c2 -10 12 -10 13 -1"
              stroke="#93c5fd"
              strokeOpacity="0.14"
              strokeWidth="3"
              fill="none"
            />
          </g>
        </g>

        {/* ===== Faixa/pontinhos decorativos ao fundo ===== */}
        <g>
          <circle cx="420" cy="140" r="5" fill="#93c5fd" fillOpacity="0.12" />
          <circle cx="470" cy="110" r="3" fill="#F58634" fillOpacity="0.14" />
          <circle cx="980" cy="120" r="4" fill="#93c5fd" fillOpacity="0.12" />
          <circle cx="1030" cy="150" r="3" fill="#F58634" fillOpacity="0.12" />
          <path
            d="M330 96 q40 -22 80 0"
            stroke="#93c5fd"
            strokeOpacity="0.08"
            strokeWidth="3"
            fill="none"
          />
          <path
            d="M1000 84 q40 -22 80 0"
            stroke="#93c5fd"
            strokeOpacity="0.08"
            strokeWidth="3"
            fill="none"
          />
        </g>
      </svg>
    </div>
  )
}

export default HeroStorefrontWatermark
