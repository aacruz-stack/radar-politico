import { useEffect, useState } from 'react'

// Persistência local: progresso, anotações e preferências ficam no localStorage do navegador.
const PREFIXO = 'trilha-dados:'

function ler(chave, padrao) {
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

export function usePersistente(chave, padrao) {
  const [valor, setValor] = useState(() => ler(chave, padrao))
  useEffect(() => gravar(chave, valor), [chave, valor])
  return [valor, setValor]
}

// Exporta/importa tudo em JSON, para backup ou para levar a outro navegador.
export function exportarDados() {
  const dados = {}
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k.startsWith(PREFIXO)) dados[k.slice(PREFIXO.length)] = ler(k.slice(PREFIXO.length))
  }
  return dados
}

export function importarDados(dados) {
  Object.entries(dados).forEach(([k, v]) => gravar(k, v))
}
