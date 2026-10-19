# Radar Político

Votos, gastos e salários de quem exerce poder no Brasil, com a fonte oficial de cada número.
Site estático (HTML/CSS/JS puro, sem build) + coletores em Python (somente biblioteca padrão)
que rodam no GitHub Actions 3x ao dia (7h, 12h e 22h, horário de Brasília) e fazem commit dos
JSON em `data/`. Cada commit dispara o deploy no Netlify.

## Cobertura
| Casa | Votos nominais | Gastos | Salário |
|---|---|---|---|
| Câmara dos Deputados | sim (plenário, 120 dias) | CEAP | sim |
| Senado | sim (120 dias) | CEAPS | sim |
| ALESP | **não** (só comissões em dados abertos) | verba de gabinete | sim |
| Vereadores SP | **pendente** | **pendente** | sim |
| Presidente | – | CPGF/viagens (exige chave) | sim |
| Governador SP | – | **sem API** | sim |
| Prefeito SP | – | execução orçamentária por órgão | sim |

Fichas de lei (resumo rápido + o que faz / quem ganha / quem paga / impacto / dois lados):
geradas por IA a partir da ementa (`scripts/gerar_fichas.py`) quando `ANTHROPIC_API_KEY` existe.
Sem a chave, o site mostra a ementa oficial. Toda ficha gerada é identificada como tal.

## Publicar
1. Criar repositório público no GitHub e dar push desta pasta.
2. Em *Settings → Actions → General → Workflow permissions*: "Read and write".
3. Em *Settings → Secrets → Actions* (opcionais):
   - `PORTAL_TRANSPARENCIA_KEY` (gratuita: portaldatransparencia.gov.br/api-de-dados/cadastrar-email)
   - `ANTHROPIC_API_KEY` (fichas por IA; `FICHAS_POR_EXECUCAO` limita o custo, padrão 12)
4. Netlify → *Add new site → Import from Git* → escolher o repositório. Build command vazio,
   publish directory `.` (o `netlify.toml` já define isso).
5. Aba *Actions → Atualizar dados → Run workflow* para a primeira execução.

## Rodar local
    python3 scripts/run_all.py        # coleta tudo
    python3 -m http.server 8000       # abrir http://localhost:8000

## Salários
`data/salarios.json` é estático. Revisar e citar a norma ao atualizar.
