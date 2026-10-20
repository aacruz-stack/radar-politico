import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Aula from './components/Aula'
import { trilha, todasAulas } from './data/trilha'
import { gravar, usePersistente } from './storage'

const desktop = () => window.matchMedia('(min-width: 1024px)').matches
const aulaDoHash = () => todasAulas.find((a) => `#/aula/${a.id}` === window.location.hash)

export default function App() {
  const [concluidas, setConcluidas] = usePersistente('concluidas', {})
  const [anotacoes, setAnotacoes] = usePersistente('anotacoes', {})
  const [ultimaAula, setUltimaAula] = usePersistente('ultima-aula', null)
  const [sidebarAberta, setSidebarAberta] = useState(desktop)

  // Aula inicial: link direto (#/aula/id) → última assistida → primeira não concluída.
  const [aulaId, setAulaId] = useState(
    () =>
      aulaDoHash()?.id ??
      (todasAulas.some((a) => a.id === ultimaAula) ? ultimaAula : null) ??
      (todasAulas.find((a) => !concluidas[a.id]) ?? todasAulas[0]).id,
  )

  useEffect(() => {
    setUltimaAula(aulaId)
    if (window.location.hash !== `#/aula/${aulaId}`) history.replaceState(null, '', `#/aula/${aulaId}`)
  }, [aulaId, setUltimaAula])

  useEffect(() => {
    const aoMudarHash = () => {
      const aula = aulaDoHash()
      if (aula) setAulaId(aula.id)
    }
    window.addEventListener('hashchange', aoMudarHash)
    return () => window.removeEventListener('hashchange', aoMudarHash)
  }, [])

  const indice = todasAulas.findIndex((a) => a.id === aulaId)
  const aula = todasAulas[indice]
  const modulo = trilha[aula.moduloIndex]

  const totalConcluidas = useMemo(() => todasAulas.filter((a) => concluidas[a.id]).length, [concluidas])
  const percentual = Math.round((totalConcluidas / todasAulas.length) * 100)

  const selecionar = useCallback((id) => {
    setAulaId(id)
    if (!desktop()) setSidebarAberta(false)
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const alternarConcluida = useCallback(
    (id) => setConcluidas((atual) => ({ ...atual, [id]: !atual[id] })),
    [setConcluidas],
  )

  // Grava a anotação de forma síncrona: o salvamento pode acontecer ao fechar a aba,
  // quando não haverá novo render para o efeito do usePersistente rodar.
  const anotacoesRef = useRef(anotacoes)
  const salvarAnotacao = useCallback(
    (id, texto) => {
      const novas = { ...anotacoesRef.current, [id]: texto }
      anotacoesRef.current = novas
      gravar('anotacoes', novas)
      setAnotacoes(novas)
    },
    [setAnotacoes],
  )

  return (
    <div className="flex h-dvh flex-col">
      <Header
        percentual={percentual}
        concluidas={totalConcluidas}
        total={todasAulas.length}
        aoAlternarSidebar={() => setSidebarAberta((v) => !v)}
      />
      <div className="flex min-h-0 flex-1">
        <Sidebar
          aberta={sidebarAberta}
          aulaAtualId={aulaId}
          moduloAtualId={modulo.id}
          concluidas={concluidas}
          aoSelecionar={selecionar}
          aoAlternarConcluida={alternarConcluida}
          aoFechar={() => setSidebarAberta(false)}
        />
        <main className="min-w-0 flex-1 overflow-y-auto">
          <Aula
            modulo={modulo}
            aula={aula}
            anterior={todasAulas[indice - 1]}
            proxima={todasAulas[indice + 1]}
            concluida={!!concluidas[aula.id]}
            anotacao={anotacoes[aula.id] ?? ''}
            aoAlternarConcluida={alternarConcluida}
            aoSelecionar={selecionar}
            aoSalvarAnotacao={salvarAnotacao}
          />
        </main>
      </div>
    </div>
  )
}
