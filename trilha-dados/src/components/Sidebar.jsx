import { useEffect, useState } from 'react'
import { trilha } from '../data/trilha'
import { IconeCheck, IconeSeta, IconeFechar, IconePlay } from './Icones'

export default function Sidebar({ aberta, aulaAtualId, moduloAtualId, concluidas, aoSelecionar, aoAlternarConcluida, aoFechar }) {
  // Módulos expandidos: começa com o módulo da aula atual aberto.
  const [expandidos, setExpandidos] = useState(() => new Set([moduloAtualId]))

  // Ao navegar para outro módulo (Próxima/Anterior), expande o módulo da aula atual.
  useEffect(() => setExpandidos((atual) => new Set(atual).add(moduloAtualId)), [moduloAtualId])

  function alternarModulo(id) {
    setExpandidos((atual) => {
      const novo = new Set(atual)
      novo.has(id) ? novo.delete(id) : novo.add(id)
      return novo
    })
  }

  return (
    <>
      {/* Fundo escurecido no mobile */}
      <div
        onClick={aoFechar}
        className={`fixed inset-0 z-30 bg-black/60 transition-opacity lg:hidden ${aberta ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-80 shrink-0 border-r border-zinc-800 bg-zinc-900 transition-[transform,margin] duration-300
          pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] lg:static lg:z-0 lg:h-full lg:pt-0 lg:pb-0
          ${aberta ? 'translate-x-0' : '-translate-x-full lg:-ml-80'}`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
            <p className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">Conteúdo da trilha</p>
            <button onClick={aoFechar} className="rounded p-1 text-zinc-400 hover:text-zinc-100 lg:hidden" aria-label="Fechar">
              <IconeFechar />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-2">
            {trilha.map((modulo, mi) => {
              const feitas = modulo.aulas.filter((a) => concluidas[a.id]).length
              const completo = feitas === modulo.aulas.length
              const expandido = expandidos.has(modulo.id)

              return (
                <div key={modulo.id} className="px-2">
                  <button
                    onClick={() => alternarModulo(modulo.id)}
                    className="flex w-full items-start gap-3 rounded-lg px-2 py-3 text-left hover:bg-zinc-800/60"
                  >
                    <span
                      className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-md text-xs font-bold
                        ${completo ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-800 text-zinc-300'}`}
                    >
                      {completo ? <IconeCheck className="size-4" /> : mi + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm leading-snug font-medium text-zinc-100">{modulo.titulo}</span>
                      <span className="mt-0.5 block text-xs text-zinc-500">
                        {feitas}/{modulo.aulas.length} {modulo.aulas.length === 1 ? 'aula' : 'aulas'}
                      </span>
                    </span>
                    <IconeSeta className={`mt-1 size-4 shrink-0 text-zinc-500 transition-transform ${expandido ? 'rotate-90' : ''}`} />
                  </button>

                  {expandido && (
                    <ul className="mb-2 ml-5 border-l border-zinc-800 pl-3">
                      {modulo.aulas.map((aula, ai) => {
                        const ativa = aula.id === aulaAtualId
                        const feita = !!concluidas[aula.id]
                        return (
                          <li key={aula.id} className="flex items-center gap-2">
                            <button
                              onClick={() => aoAlternarConcluida(aula.id)}
                              title={feita ? 'Desmarcar' : 'Marcar como concluída'}
                              className={`grid size-5 shrink-0 place-items-center rounded-full border transition-colors
                                ${feita ? 'border-emerald-500 bg-emerald-500 text-zinc-950' : 'border-zinc-600 hover:border-emerald-400'}`}
                            >
                              {feita && <IconeCheck className="size-3.5" />}
                            </button>
                            <button
                              onClick={() => aoSelecionar(aula.id)}
                              className={`flex flex-1 items-start gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors
                                ${ativa ? 'bg-brand-500/15 text-brand-400' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100'}`}
                            >
                              {ativa && <IconePlay className="mt-0.5 size-3.5 shrink-0" />}
                              <span className="leading-snug">
                                <span className="text-zinc-500">Aula {ai + 1} · </span>
                                {aula.titulo}
                              </span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              )
            })}
          </nav>
        </div>
      </aside>
    </>
  )
}
