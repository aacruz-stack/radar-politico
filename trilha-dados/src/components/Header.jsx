import { useRef } from 'react'
import { IconeMenu, IconeDownload, IconeUpload, IconeTrofeu } from './Icones'
import { exportarDados, importarDados } from '../storage'

export default function Header({ percentual, concluidas, total, aoAlternarSidebar }) {
  const inputArquivo = useRef(null)

  function baixarBackup() {
    const blob = new Blob([JSON.stringify(exportarDados(), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = Object.assign(document.createElement('a'), { href: url, download: 'trilha-dados-backup.json' })
    a.click()
    URL.revokeObjectURL(url)
  }

  async function restaurarBackup(e) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return
    try {
      importarDados(JSON.parse(await arquivo.text()))
      window.location.reload()
    } catch {
      alert('Arquivo de backup inválido.')
    }
    e.target.value = ''
  }

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

        <div className="ml-auto flex items-center gap-1">
          <button onClick={baixarBackup} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100" title="Exportar progresso e anotações">
            <IconeDownload />
          </button>
          <button onClick={() => inputArquivo.current?.click()} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100" title="Importar backup">
            <IconeUpload />
          </button>
          <input ref={inputArquivo} type="file" accept="application/json" className="hidden" onChange={restaurarBackup} />
        </div>
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
