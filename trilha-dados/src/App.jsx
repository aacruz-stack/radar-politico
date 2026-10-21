import { useCallback, useEffect, useMemo, useState } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Aula from './components/Aula'
import { trilha, todasAulas } from './data/trilha'
import { useProgresso } from './sync'

const desktop = () => window.matchMedia('(min-width: 1024px)').matches
// Link direto para uma aula: ...#m5-a2 (aceita também o formato antigo #/aula/m5-a2).
const aulaDoHash = () => todasAulas.find((a) => window.location.hash.replace('#/aula/', '#') === `#${a.id}`)

export default function App() {
  const [estado, atualizar, nuvem] = useProgresso()
  const { concluidas, anotacoes, ultima: ultimaAula } = estado
  const [sidebarAberta, setSidebarAberta] = useState(desktop)

  // Aula inicial: link direto (#/aula/id) → última assistida → primeira não concluída.
  const [aulaId, setAulaId] = useState(
    () =>
      aulaDoHash()?.id ??
      (todasAulas.some((a) => a.id === ultimaAula) ? ultimaAula : null) ??
      (todasAulas.find((a) => !concluidas[a.id]) ?? todasAulas[0]).id,
  )

  useEffect(() => {
    atualizar((e) => (e.ultima === aulaId ? e : { ...e, ultima: aulaId }))
    try {
      if (window.location.hash !== `#${aulaId}`) history.replaceState(null, '', `#${aulaId}`)
    } catch {
      // Dentro do visualizador do claude.ai a URL não pode ser alterada.
    }
  }, [aulaId, atualizar])

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
    (id) => atualizar((e) => ({ ...e, concluidas: { ...e.concluidas, [id]: !e.concluidas[id] } })),
    [atualizar],
  )

  const salvarAnotacao = useCallback(
    (id, texto) =>
      atualizar((e) => (e.anotacoes[id] === texto ? e : { ...e, anotacoes: { ...e.anotacoes, [id]: texto } })),
    [atualizar],
  )

  return (
    <div className="flex h-full flex-col">
      <Header
        percentual={percentual}
        concluidas={totalConcluidas}
        total={todasAulas.length}
        nuvem={nuvem}
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
