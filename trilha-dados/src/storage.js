// Persistência local: o estado do aluno fica no localStorage do navegador.
const PREFIXO = 'trilha-dados:'

export function ler(chave, padrao) {
  try {
    const bruto = localStorage.getItem(PREFIXO + chave)
    return bruto === null ? padrao : JSON.parse(bruto)
  } catch {
    return padrao
  }
}

export function gravar(chave, valor) {
  try {
    localStorage.setItem(PREFIXO + chave, JSON.stringify(valor))
  } catch {
    // Armazenamento indisponível (aba anônima, cota cheia): segue só em memória.
  }
}

// Oferece um arquivo de texto para download. Como Artifact, links de download são
// bloqueados e o arquivo passa pela capacidade `downloads` do claude.ai.
export async function baixar(nome, texto, tipo = 'text/markdown') {
  if (window.claude?.use) {
    const downloads = await window.claude.use('downloads')
    if (downloads) return downloads.save({ filename: nome, data: new Blob([texto], { type: tipo }) }).catch(() => {})
  }
  const url = URL.createObjectURL(new Blob([texto], { type: tipo }))
  Object.assign(document.createElement('a'), { href: url, download: nome }).click()
  URL.revokeObjectURL(url)
}
