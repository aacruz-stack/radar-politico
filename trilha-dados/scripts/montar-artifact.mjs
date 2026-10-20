// Junta o build de dist-artifact/ num único arquivo de página para o Artifact do claude.ai.
// O publicador já envolve a página em <html><head><body>, então só vão título, estilo e scripts.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'

const dir = new URL('../dist-artifact/', import.meta.url)
const assets = readdirSync(new URL('assets/', dir))
const ler = (ext) => assets.filter((f) => f.endsWith(ext)).map((f) => readFileSync(new URL('assets/' + f, dir), 'utf8')).join('\n')

const js = ler('.js').replace(/<\/script/gi, '<\\/script')
const css = ler('.css').replace(/<\/style/gi, '<\\/style')

const pagina = `<title>Trilha Dados + IA</title>
<style>${css}</style>
<div id="root"></div>
<script type="module">${js}</script>
`
writeFileSync(new URL('trilha.html', dir), pagina)
console.log(`dist-artifact/trilha.html: ${(pagina.length / 1024).toFixed(0)} KB`)
