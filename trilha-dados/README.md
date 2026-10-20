# Trilha Engenharia de Dados + IA

Plataforma pessoal de estudos (LMS) com 7 módulos e 8 aulas, do SQL até agentes de IA.
React 19 + Vite + Tailwind CSS 4. Progresso e anotações ficam salvos no `localStorage` do navegador.

## Rodar
    cd trilha-dados
    npm install
    npm run dev        # abre em http://localhost:5173

`npm run build` gera a versão estática em `dist/`.

## Funcionalidades
- Player do YouTube embutido, com navegação Anterior/Próxima e link direto por aula (`#/aula/m5-a2`).
- Sidebar retrátil com módulos, aulas e check de concluída (clique no círculo para marcar).
- Barra de progresso geral ("X% da Trilha Concluída").
- Anotações por aula com salvamento automático e download em `.md`.
- Resumo com os pontos-chave de cada módulo.
- Backup: os ícones no topo exportam/importam progresso + anotações em JSON
  (útil para trocar de navegador, já que o `localStorage` é por navegador).

## Editar a trilha
Módulos, aulas e resumos ficam em `src/data/trilha.js`. Para adicionar uma aula, inclua
`{ id: 'm5-a3', titulo: '...', videoId: 'ID_DO_YOUTUBE' }` no módulo desejado.
Use sempre um `id` novo: é ele que liga a aula ao progresso e às anotações salvas.
