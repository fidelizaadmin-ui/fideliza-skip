// Gera public/og-image.png (1200x630) a partir da identidade visual do Fideliza:
// o símbolo (caixa de presente azul com laço laranja e "F") vem de public/favicon.svg
// e o wordmark "Fideliza" vem dos paths vetoriais de src/components/Logo.tsx.
// Rasterização própria (scanline even-odd) + codificação PNG via zlib nativo.
// Rodar: node scripts/generate-og-image.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import zlib from 'node:zlib'

const SS = 2 // supersampling 2x
const W = 1200
const H = 630
const Ws = W * SS
const Hs = H * SS

const hex = (h) => {
  const s = h.replace('#', '')
  const f =
    s.length === 3
      ? s
          .split('')
          .map((c) => c + c)
          .join('')
      : s
  return [parseInt(f.slice(0, 2), 16), parseInt(f.slice(2, 4), 16), parseInt(f.slice(4, 6), 16)]
}

// ---------------- parse de paths SVG ----------------
const CMD_RE = /([MLHVQCZmlhvqcz])([^MLHVQCZmlhvqcz]*)/g
const NUM_RE = /[-+]?[\d.]+(?:[eE][-+]?\d+)?/g
const CURVE_SEGMENTS = 20

function flatten(d, xf) {
  if (/[AaSsTt]/.test(d)) throw new Error('Comando de path não suportado: ' + d.slice(0, 40))
  const polys = []
  let cur = { x: 0, y: 0 }
  let start = { x: 0, y: 0 }
  const push = () => polys.push([])
  const emit = (x, y) => {
    const [X, Y] = xf(x, y)
    polys[polys.length - 1].push({ x: X, y: Y })
  }

  for (const m of d.matchAll(CMD_RE)) {
    const cmd = m[1]
    const nums = (m[2].match(NUM_RE) || []).map(Number)
    let i = 0
    const pair = () => ({ x: nums[i++], y: nums[i++] })

    if (cmd === 'M' || cmd === 'm') {
      const rel = cmd === 'm'
      const p0 = pair()
      cur = rel ? { x: cur.x + p0.x, y: cur.y + p0.y } : p0
      start = { ...cur }
      push()
      emit(cur.x, cur.y)
      while (i + 1 < nums.length) {
        const p = pair()
        cur = rel ? { x: cur.x + p.x, y: cur.y + p.y } : p
        emit(cur.x, cur.y)
      }
    } else if (cmd === 'L' || cmd === 'l') {
      const rel = cmd === 'l'
      if (!polys.length) push()
      while (i + 1 < nums.length) {
        const p = pair()
        cur = rel ? { x: cur.x + p.x, y: cur.y + p.y } : p
        emit(cur.x, cur.y)
      }
    } else if (cmd === 'H' || cmd === 'h') {
      const rel = cmd === 'h'
      if (!polys.length) push()
      while (i < nums.length) {
        cur = { x: rel ? cur.x + nums[i++] : nums[i++], y: cur.y }
        emit(cur.x, cur.y)
      }
    } else if (cmd === 'V' || cmd === 'v') {
      const rel = cmd === 'v'
      if (!polys.length) push()
      while (i < nums.length) {
        cur = { x: cur.x, y: rel ? cur.y + nums[i++] : nums[i++] }
        emit(cur.x, cur.y)
      }
    } else if (cmd === 'C' || cmd === 'c') {
      const rel = cmd === 'c'
      if (!polys.length) push()
      while (i + 5 < nums.length) {
        // Regra SVG: em comandos relativos repetidos, cada par é relativo ao par anterior.
        const p0 = { ...cur }
        const d1 = pair(),
          d2 = pair(),
          d3 = pair()
        const c1 = rel ? { x: p0.x + d1.x, y: p0.y + d1.y } : d1
        const c2 = rel ? { x: c1.x + d2.x, y: c1.y + d2.y } : d2
        const end = rel ? { x: c2.x + d3.x, y: c2.y + d3.y } : d3
        for (let s = 1; s <= CURVE_SEGMENTS; s++) {
          const t = s / CURVE_SEGMENTS
          const u = 1 - t
          const x =
            u * u * u * p0.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * end.x
          const y =
            u * u * u * p0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * end.y
          emit(x, y)
        }
        cur = end
      }
    } else if (cmd === 'Q' || cmd === 'q') {
      const rel = cmd === 'q'
      if (!polys.length) push()
      while (i + 3 < nums.length) {
        const p0 = { ...cur }
        const d1 = pair(),
          d2 = pair()
        const c = rel ? { x: p0.x + d1.x, y: p0.y + d1.y } : d1
        const end = rel ? { x: c.x + d2.x, y: c.y + d2.y } : d2
        for (let s = 1; s <= CURVE_SEGMENTS; s++) {
          const t = s / CURVE_SEGMENTS
          const u = 1 - t
          emit(
            u * u * p0.x + 2 * u * t * c.x + t * t * end.x,
            u * u * p0.y + 2 * u * t * c.y + t * t * end.y,
          )
        }
        cur = end
      }
    } else if (cmd === 'Z' || cmd === 'z') {
      if (polys.length && polys[polys.length - 1].length) {
        emit(start.x, start.y)
        cur = { ...start }
      }
    }
  }
  return polys.filter((p) => p.length > 1)
}

// ---------------- rasterização even-odd ----------------
function rasterize(polys) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity
  const edges = []
  for (const poly of polys) {
    let prev = null
    for (const p of poly) {
      if (p.x < minX) minX = p.x
      if (p.y < minY) minY = p.y
      if (p.x > maxX) maxX = p.x
      if (p.y > maxY) maxY = p.y
      if (prev && prev.y !== p.y) {
        edges.push(
          prev.y < p.y
            ? { y0: prev.y, y1: p.y, x0: prev.x, x1: p.x }
            : { y0: p.y, y1: prev.y, x0: p.x, x1: prev.x },
        )
      }
      prev = p
    }
  }
  if (!edges.length) return null
  const x0i = Math.floor(minX)
  const y0i = Math.floor(minY)
  const gw = Math.ceil(maxX) - x0i + 1
  const gh = Math.ceil(maxY) - y0i + 1
  const rows = []
  for (let r = 0; r < gh; r++) {
    const yc = y0i + r + 0.5
    const xs = []
    for (const e of edges) {
      if (yc >= e.y0 && yc < e.y1) {
        const t = (yc - e.y0) / (e.y1 - e.y0)
        xs.push(e.x0 + t * (e.x1 - e.x0))
      }
    }
    xs.sort((a, b) => a - b)
    const row = new Uint8Array(gw)
    let covered = 0
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const c0 = Math.max(0, Math.ceil(xs[k] - x0i - 0.5))
      const c1 = Math.min(gw - 1, Math.floor(xs[k + 1] - x0i - 0.5))
      for (let c = c0; c <= c1; c++) {
        row[c] = 1
        covered++
      }
    }
    rows.push(row)
  }
  return { x0i, y0i, gw, gh, rows }
}

// ---------------- canvas + pintura ----------------
const canvas = new Uint8Array(Ws * Hs * 4)
// fundo: gradiente vertical oficial #0283FD -> #012D76
const BG0 = hex('#0283FD')
const BG1 = hex('#012D76')
for (let y = 0; y < Hs; y++) {
  const t = y / (Hs - 1)
  const r = Math.round(BG0[0] + (BG1[0] - BG0[0]) * t)
  const g = Math.round(BG0[1] + (BG1[1] - BG0[1]) * t)
  const b = Math.round(BG0[2] + (BG1[2] - BG0[2]) * t)
  for (let x = 0; x < Ws; x++) {
    const idx = (y * Ws + x) * 4
    canvas[idx] = r
    canvas[idx + 1] = g
    canvas[idx + 2] = b
    canvas[idx + 3] = 255
  }
}

function paint(raster, colorFn) {
  if (!raster) throw new Error('Path vazio ao rasterizar')
  const { x0i, y0i, gw, gh, rows } = raster
  for (let r = 0; r < gh; r++) {
    const row = rows[r]
    const py = y0i + r
    if (py < 0 || py >= Hs) continue
    for (let c = 0; c < gw; c++) {
      if (!row[c]) continue
      const px = x0i + c
      if (px < 0 || px >= Ws) continue
      const [cr, cg, cb, ca] = colorFn(px, py)
      const a = ca / 255
      const idx = (py * Ws + px) * 4
      canvas[idx] = Math.round(cr * a + canvas[idx] * (1 - a))
      canvas[idx + 1] = Math.round(cg * a + canvas[idx + 1] * (1 - a))
      canvas[idx + 2] = Math.round(cb * a + canvas[idx + 2] * (1 - a))
    }
  }
}

const solid =
  (rgb, a = 255) =>
  () => [rgb[0], rgb[1], rgb[2], a]
const gradient = (g0, g1, c0, c1) => {
  const dx = g1[0] - g0[0]
  const dy = g1[1] - g0[1]
  const len2 = dx * dx + dy * dy
  return (X, Y) => {
    let t = len2 ? ((X - g0[0]) * dx + (Y - g0[1]) * dy) / len2 : 0
    t = Math.max(0, Math.min(1, t))
    return [
      Math.round(c0[0] + (c1[0] - c0[0]) * t),
      Math.round(c0[1] + (c1[1] - c0[1]) * t),
      Math.round(c0[2] + (c1[2] - c0[2]) * t),
      255,
    ]
  }
}

// ---------------- símbolo a partir de public/favicon.svg ----------------
const favSvg = readFileSync(
  fileURLToPath(new URL('../public/favicon.svg', import.meta.url)),
  'utf8',
)

function parseTransformAttr(attrs) {
  const mats = []
  const re = /(matrix|translate|scale)\(([^)]*)\)/g
  let m
  while ((m = re.exec(attrs))) {
    const n = (m[2].match(NUM_RE) || []).map(Number)
    if (m[1] === 'matrix') mats.push([n[0], n[1], n[2], n[3], n[4], n[5]])
    else if (m[1] === 'translate') mats.push([1, 0, 0, 1, n[0] || 0, n[1] || 0])
    else mats.push([n[0] || 1, 0, 0, n[1] == null ? n[0] || 1 : n[1], 0, 0])
  }
  return mats
}

const mul = (A, B) => [
  A[0] * B[0] + A[2] * B[1],
  A[1] * B[0] + A[3] * B[1],
  A[0] * B[2] + A[2] * B[3],
  A[1] * B[2] + A[3] * B[3],
  A[0] * B[4] + A[2] * B[5] + A[4],
  A[1] * B[4] + A[3] * B[5] + A[5],
]

function parseSvgPaths(svgText) {
  const paths = []
  const stack = []
  const tagRe = /<(\/?)(g|path|svg)\b([^>]*)>/g
  let m
  while ((m = tagRe.exec(svgText))) {
    const closing = m[1] === '/'
    const tag = m[2]
    const attrs = m[3]
    if (tag === 'g') {
      if (closing) stack.pop()
      else stack.push(parseTransformAttr(attrs))
    } else if (tag === 'path' && !closing) {
      const dM = /d="([^"]*)"/.exec(attrs)
      const fillM = /fill="([^"]*)"/.exec(attrs)
      if (dM) paths.push({ d: dM[1], fill: fillM ? fillM[1] : '#000', mats: [...stack] })
    }
  }
  return paths
}

// view -> tela (SS): viewBox 30000 0 40000 36000
const SYM_H = 240
const symScale = (SYM_H * SS) / 36000
const symW = 40000 * symScale
const symX0 = (Ws - symW) / 2
const symY0 = 130 * SS
const symMap = (x, y) => [symX0 + (x - 30000) * symScale, symY0 + y * symScale]

const symbolPaths = parseSvgPaths(favSvg)
if (symbolPaths.length < 9) throw new Error('favicon.svg: paths do símbolo não encontrados')

for (const p of symbolPaths) {
  let total = [1, 0, 0, 1, 0, 0]
  for (const mat of p.mats) total = mul(total, mat)
  const xf = (x, y) => {
    const X = total[0] * x + total[2] * y + total[4]
    const Y = total[1] * x + total[3] * y + total[5]
    return symMap(X, Y)
  }
  let colorFn
  if (p.fill.startsWith('url(')) {
    const g0 = symMap(43340.86, 23354.42)
    const g1 = symMap(63884.39, 18283.63)
    colorFn = gradient(g0, g1, hex('#012D76'), hex('#0283FD'))
  } else {
    colorFn = solid(hex(p.fill))
  }
  const ras = rasterize(flatten(p.d, xf))
  paint(ras, colorFn)
}

// ---------------- wordmark a partir de src/components/Logo.tsx ----------------
const logoSrc = readFileSync(
  fileURLToPath(new URL('../src/components/Logo.tsx', import.meta.url)),
  'utf8',
)
const grab = (name) => {
  const m = logoSrc.match(new RegExp('const ' + name + "\\s*=\\s*'([^']+)'"))
  if (!m) throw new Error('Constante não encontrada em Logo.tsx: ' + name)
  return m[1]
}

const WM_H = 76
const wmScale = (WM_H * SS) / 23000
const wmW = 100297.75 * wmScale
const wmX0 = (Ws - wmW) / 2
const wmY0 = 440 * SS
const wmMap = (x, y) => [wmX0 + x * wmScale, wmY0 + (y - 34000) * wmScale]

const wordmarkParts = [
  { d: grab('WORDMARK_I_DOT_1'), color: hex('#F58634') },
  { d: grab('WORDMARK_I_DOT_2'), color: hex('#F58634') },
  { d: grab('WORDMARK_LETTERS'), color: hex('#FFFFFF') },
]
for (const part of wordmarkParts) {
  const ras = rasterize(flatten(part.d, (x, y) => wmMap(x, y)))
  paint(ras, solid(part.color))
}

// círculos decorativos suaves
const circle = (cx, cy, r, alpha) => {
  const pts = []
  for (let i = 0; i <= 72; i++) {
    const a = (i / 72) * Math.PI * 2
    pts.push({ x: (cx + Math.cos(a) * r) * SS, y: (cy + Math.sin(a) * r) * SS })
  }
  paint(rasterize([pts]), solid([255, 255, 255], alpha))
}
circle(150, 60, 170, 14)
circle(1090, 570, 210, 12)

// ---------------- downsample + PNG ----------------
const out = Buffer.alloc(W * H * 4)
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    for (let k = 0; k < 4; k++) {
      let sum = 0
      for (let sy = 0; sy < SS; sy++)
        for (let sx = 0; sx < SS; sx++) sum += canvas[((y * SS + sy) * Ws + x * SS + sx) * 4 + k]
      out[(y * W + x) * 4 + k] = Math.round(sum / (SS * SS))
    }
  }
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(W, 0)
ihdr.writeUInt32BE(H, 4)
ihdr[8] = 8 // bit depth
ihdr[9] = 6 // RGBA
const raw = Buffer.alloc((W * 4 + 1) * H)
for (let y = 0; y < H; y++) {
  raw[y * (W * 4 + 1)] = 0
  out.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4)
}
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
])

const outPath = fileURLToPath(new URL('../public/og-image.png', import.meta.url))
writeFileSync(outPath, png)

// sanidade: quantos pixels diferem do fundo puro em cada faixa
let diff = 0
for (let i = 0; i < out.length; i += 4) {
  const y = Math.floor(i / 4 / W)
  const t = y / (H - 1)
  const er = Math.round(BG0[0] + (BG1[0] - BG0[0]) * t)
  if (Math.abs(out[i] - er) > 6) diff++
}
console.log(
  `og-image.png gerado: ${W}x${H}, ${png.length} bytes, ${diff} pixels de marca (${((diff / (W * H)) * 100).toFixed(1)}% do canvas)`,
)
if (diff < W * H * 0.05) throw new Error('Imagem quase vazia — verifique os paths')
