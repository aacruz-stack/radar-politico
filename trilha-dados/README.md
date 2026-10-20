# Trilha Engenharia de Dados + IA

Plataforma pessoal de estudos (LMS) com 7 módulos e 8 aulas, do SQL até agentes de IA.
React 19 + Vite + Tailwind CSS 4. Progresso e anotações ficam salvos no `localStorage` do navegador.

## Acessar online
https://claude.ai/artifact/QVkb6cdHwQpXiC9nqoM8aS (Artifact privado no claude.ai, entre com a sua conta).

Lá o progresso e as anotações ficam salvos na sua conta e sincronizam entre dispositivos.
O visualizador do claude.ai não permite vídeos embutidos, então a capa da aula abre o vídeo no YouTube.
Para atualizar: `npm run build:artifact` gera `dist-artifact/trilha.html`, que é republicado no mesmo link.

Opcional: o workflow `.github/workflows/trilha-pages.yml` publica no GitHub Pages (com player embutido)
depois de ativar *Settings → Pages → Source: GitHub Actions* e fazer merge em `main`.

## Rodar local
    cd trilha-dados
    npm install
    npm run dev        # abre em http://localhost:5173

`npm run build` gera a versão estática em `dist/`.

## Funcionalidades
- Player do YouTube (embutido no GitHub Pages/local; link para o YouTube no Artifact), navegação Anterior/Próxima e link direto por aula (`#m5-a2`).
- Sidebar retrátil com módulos, aulas e check de concluída (clique no círculo para marcar).
- Barra de progresso geral ("X% da Trilha Concluída").
- Anotações por aula com salvamento automático e download em `.md`.
- Resumo com os pontos-chave de cada módulo.
- Indicador de sincronização no topo: "Sincronizado na sua conta" no Artifact; "Salvo neste dispositivo" fora dele.

## Editar a trilha
Módulos, aulas e resumos ficam em `src/data/trilha.js`. Para adicionar uma aula, inclua
`{ id: 'm5-a3', titulo: '...', videoId: 'ID_DO_YOUTUBE' }` no módulo desejado.
Use sempre um `id` novo: é ele que liga a aula ao progresso e às anotações salvas.
