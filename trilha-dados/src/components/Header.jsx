import { IconeMenu, IconeTrofeu, IconeNuvem } from './Icones'

const NUVEM = {
  local: { texto: 'Salvo neste dispositivo', cor: 'text-zinc-500', ponto: 'bg-zinc-500' },
  conectando: { texto: 'Conectando…', cor: 'text-zinc-400', ponto: 'bg-amber-400 animate-pulse' },
  sincronizado: { texto: 'Sincronizado na sua conta', cor: 'text-emerald-400', ponto: 'bg-emerald-400' },
  erro: { texto: 'Sem sincronizar (salvo aqui)', cor: 'text-amber-400', ponto: 'bg-amber-400' },
}

export default function Header({ percentual, concluidas, total, nuvem, aoAlternarSidebar }) {
  const status = NUVEM[nuvem]
  return (
    <header className="shrink-0 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4">
        <button
          onClick={aoAlternarSidebar}
          className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          aria-label="Mostrar ou ocultar módulos"
        >
          <IconeMenu />
        </button>

        <div className="flex min-w-0 items-center gap-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-fuchsia-500 text-sm font-bold">
            DE
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">Engenharia de Dados + IA</p>
            <p className="hidden text-xs text-zinc-500 sm:block">Trilha de estudos pessoal</p>
          </div>
        </div>

        <p className={`ml-auto flex items-center gap-2 text-xs ${status.cor}`} title={status.texto}>
          <IconeNuvem className="size-4" />
          <span className="hidden sm:inline">{status.texto}</span>
          <span className={`size-2 rounded-full ${status.ponto}`} />
        </p>
      </div>

      {/* Barra de progresso geral da trilha */}
      <div className="flex items-center gap-3 px-4 pb-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-fuchsia-500 transition-all duration-500"
            style={{ width: `${percentual}%` }}
          />
        </div>
        <p className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-zinc-300">
          {percentual === 100 && <IconeTrofeu className="size-4 text-amber-400" />}
          <span className="text-zinc-100">{percentual}%</span> da Trilha Concluída
          <span className="hidden text-zinc-500 sm:inline">· {concluidas}/{total} aulas</span>
        </p>
      </div>
    </header>
  )
}
