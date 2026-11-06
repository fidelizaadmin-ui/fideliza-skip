// Substitui public/og-image.png pela logo do Fideliza enviada pelo usuário
// (src/assets/image-43537.png) e ajusta og:image:width/height em index.html
// conforme as dimensões reais do arquivo.
//
// Motivo do script: arquivos *.png e package.json são protegidos (preventAI)
// e o agente não tem shell, então quem roda este passo é o dono do projeto.
//
// Rodar:  node scripts/replace-og-image.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const SRC = 'src/assets/image-43537.png'
const DEST = 'public/og-image.png'
const HTML = 'index.html'

const png = readFileSync(SRC)

// Valida assinatura PNG
const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
if (!png.subarray(0, 8).equals(SIGNATURE)) {
  console.error('ERRO: ' + SRC + ' não é um PNG válido.')
  process.exit(1)
}

// Lê IHDR: bytes 16..19 = width, 20..23 = height (big-endian)
const width = png.readUInt32BE(16)
const height = png.readUInt32BE(20)
console.log('Dimensões reais do PNG anexado: ' + width + 'x' + height)

writeFileSync(DEST, png)
console.log('OK: ' + DEST + ' substituído pela logo do Fideliza (' + width + 'x' + height + ').')

// Ajusta og:image:width/height em index.html para as dimensões reais
let html = readFileSync(HTML, 'utf8')
const setMeta = (attr, value) => {
  const re = new RegExp('(<meta property="og:image:' + attr + '" content=")(\\d+)("\\s*/?>)')
  if (!re.test(html)) {
    console.warn('AVISO: meta og:image:' + attr + ' não encontrada em index.html')
    return
  }
  html = html.replace(re, '$1' + value + '$3')
}
setMeta('width', width)
setMeta('height', height)
writeFileSync(HTML, html)
console.log(
  'OK: index.html atualizado com og:image:width=' + width + ' e og:image:height=' + height + '.',
)

if (width !== 1200 || height !== 630) {
  console.log('')
  console.log('Nota: a imagem NÃO tem 1200x630. O WhatsApp/Telegram aceitam outras')
  console.log('dimensões, mas recomenda-se proporção próxima de 1.91:1 e até 1 MB.')
}
