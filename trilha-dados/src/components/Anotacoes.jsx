import { useEffect, useRef, useState } from 'react'
import { IconeNota, IconeDownload } from './Icones'
import { baixar } from '../storage'

// Bloco de anotações com salvamento automático (debounce) no localStorage.
// O componente é remontado a cada aula (key={aula.id}), então o estado inicial vem de `texto`.
export default function Anotacoes({ aula, texto, aoSalvar }) {
  const [rascunho, setRascunho] = useState(texto)
  const [salvoEm, setSalvoEm] = useState(null)
  const timer = useRef(null)
  const pendente = useRef(null)

  // Anotação chegou de outro dispositivo: mostra, se não houver digitação em andamento.
  useEffect(() => {
    if (pendente.current === null) setRascunho(texto)
  }, [texto])

  // Ao trocar de aula ou fechar a aba, grava o que ainda estiver aguardando o debounce.
  useEffect(() => {
    const descarregar = () => {
      clearTimeout(timer.current)
      if (pendente.current !== null) aoSalvar(aula.id, pendente.current)
      pendente.current = null
    }
    window.addEventListener('pagehide', descarregar)
    return () => {
      window.removeEventListener('pagehide', descarregar)
      descarregar()
    }
  }, [aula.id, aoSalvar])

  function aoDigitar(valor) {
    setRascunho(valor)
    setSalvoEm('salvando')
    pendente.current = valor
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      aoSalvar(aula.id, valor)
      pendente.current = null
      setSalvoEm(new Date())
    }, 500)
  }

  function baixarMarkdown() {
    baixar(`anotacoes-${aula.id}.md`, `# ${aula.titulo}\n\nhttps://youtu.be/${aula.videoId}\n\n${rascunho}\n`)
  }

  const status =
    salvoEm === 'salvando'
      ? 'Salvando…'
      : salvoEm
        ? `Salvo às ${salvoEm.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
        : rascunho
          ? 'Salvo'
          : ''

  return (
    <section className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900">
      <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
        <IconeNota className="size-4 text-brand-400" />
        <h2 className="text-sm font-semibold">Minhas anotações</h2>
        <span className="ml-auto text-xs text-zinc-500">{status}</span>
        <button
          onClick={baixarMarkdown}
          disabled={!rascunho}
          className="rounded p-1 text-zinc-400 hover:text-zinc-100 disabled:opacity-30"
          title="Baixar anotações (.md)"
        >
          <IconeDownload className="size-4" />
        </button>
      </div>
      <textarea
        value={rascunho}
        onChange={(e) => aoDigitar(e.target.value)}
        placeholder="Escreva aqui os conceitos, comandos e dúvidas desta aula…"
        className="min-h-64 flex-1 resize-y bg-transparent px-4 py-3 font-mono text-sm leading-relaxed text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
      />
      <p className="border-t border-zinc-800 px-4 py-2 text-right text-xs text-zinc-600">{rascunho.length} caracteres</p>
    </section>
  )
}
