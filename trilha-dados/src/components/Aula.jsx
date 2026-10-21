import Anotacoes from './Anotacoes'
import { IconeCheck, IconeSeta, IconeVoltar, IconeLampada, IconePlay, IconeExterno } from './Icones'

export default function Aula({ modulo, aula, anterior, proxima, concluida, anotacao, aoAlternarConcluida, aoSelecionar, aoSalvarAnotacao }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-8">
      <p className="text-xs font-medium tracking-wider text-brand-400 uppercase">
        Módulo {aula.moduloIndex + 1} · Aula {aula.aulaIndex + 1}
      </p>
      <h1 className="mt-1 text-xl font-bold text-balance sm:text-2xl">{aula.titulo}</h1>
      <p className="mt-1 text-sm text-zinc-500">{modulo.titulo}</p>

      {/* Player do YouTube. Como Artifact do claude.ai não é possível embutir o vídeo,
          então a capa leva ao YouTube (no celular, abre direto no app). */}
      {__ARTIFACT__ ? (
        <a
          href={`https://www.youtube.com/watch?v=${aula.videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative mt-5 flex aspect-video max-w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-xl border border-zinc-800 bg-[radial-gradient(ellipse_at_top,var(--color-brand-600)_0%,transparent_60%),linear-gradient(160deg,#18181b,#09090b)] p-6 text-center shadow-2xl shadow-brand-500/5 focus-visible:outline-2 focus-visible:outline-brand-400"
        >
          <span className="pointer-events-none absolute -right-4 -bottom-10 text-[11rem] leading-none font-black text-white/[0.04] select-none sm:text-[16rem]">
            {String(aula.moduloIndex + 1).padStart(2, '0')}
          </span>
          <span className="grid size-16 place-items-center rounded-full bg-red-600 text-white shadow-lg shadow-red-900/40 transition-transform group-hover:scale-110 sm:size-20">
            <IconePlay className="size-7 translate-x-0.5 fill-current sm:size-9" />
          </span>
          <span className="flex items-center gap-1.5 text-sm font-semibold text-zinc-100 sm:text-base">
            Assistir no YouTube <IconeExterno className="size-4" />
          </span>
          <span className="max-w-md text-xs text-zinc-400 sm:text-sm">Abre em nova aba. Depois volte aqui para marcar como concluída e anotar.</span>
        </a>
      ) : (
        <div className="mt-5 aspect-video overflow-hidden rounded-xl border border-zinc-800 bg-black shadow-2xl shadow-brand-500/5">
          <iframe
            key={aula.videoId}
            className="size-full"
            src={`https://www.youtube.com/embed/${aula.videoId}?rel=0&modestbranding=1`}
            title={aula.titulo}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      )}

      {/* Ações */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => aoAlternarConcluida(aula.id)}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors
            ${concluida
              ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/40 hover:bg-emerald-500/25'
              : 'bg-brand-600 text-white hover:bg-brand-500'}`}
        >
          <IconeCheck className="size-4" />
          {concluida ? 'Aula concluída' : 'Marcar como Concluída'}
        </button>

        <div className="ml-auto flex gap-2">
          <button
            onClick={() => anterior && aoSelecionar(anterior.id)}
            disabled={!anterior}
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 px-3 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <IconeVoltar className="size-4" /> Anterior
          </button>
          <button
            onClick={() => proxima && aoSelecionar(proxima.id)}
            disabled={!proxima}
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 px-3 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            Próxima <IconeSeta className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Anotacoes key={aula.id} aula={aula} texto={anotacao} aoSalvar={aoSalvarAnotacao} />
        </div>

        {/* Resumo do módulo */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900 lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
            <IconeLampada className="size-4 text-amber-400" />
            <h2 className="text-sm font-semibold">Resumo do módulo: pontos-chave</h2>
          </div>
          <div className="px-4 py-4">
            <p className="text-sm text-zinc-400">{modulo.descricao}</p>
            <ul className="mt-4 space-y-3">
              {modulo.resumo.map((ponto) => (
                <li key={ponto} className="flex gap-3 text-sm leading-relaxed text-zinc-300">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-400" />
                  {ponto}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}
