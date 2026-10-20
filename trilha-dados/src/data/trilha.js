// Trilha de estudos: módulos em ordem didática, do SQL até agentes de IA.
// Para adicionar uma aula, inclua um objeto em `aulas` com um `id` único e o `videoId` do YouTube.

export const trilha = [
  {
    id: 'm1',
    titulo: 'Fundamentos de SQL e Banco de Dados Relacional',
    descricao: 'A linguagem universal dos dados: consultar, filtrar, agregar e combinar tabelas.',
    resumo: [
      'Bancos relacionais organizam dados em tabelas (linhas e colunas) ligadas por chaves.',
      'SELECT, WHERE, ORDER BY e LIMIT são a base de toda consulta.',
      'GROUP BY com funções de agregação (COUNT, SUM, AVG) gera métricas.',
      'JOINs (INNER, LEFT, RIGHT) combinam tabelas através de chaves primárias e estrangeiras.',
      'DDL (CREATE, ALTER, DROP) define a estrutura; DML (INSERT, UPDATE, DELETE) manipula os dados.',
    ],
    aulas: [
      { id: 'm1-a1', titulo: 'Instalação, Sintaxe e Prática Completa de SQL', videoId: 'G7bMwefn8RQ' },
    ],
  },
  {
    id: 'm2',
    titulo: 'Modelagem e Estruturação de Dados',
    descricao: 'Como desenhar tabelas e relacionamentos que escalam e não geram inconsistências.',
    resumo: [
      'Modelo conceitual → lógico → físico: do negócio até o banco.',
      'Entidades, atributos e relacionamentos (1:1, 1:N, N:N).',
      'Chave primária identifica a linha; chave estrangeira garante a integridade entre tabelas.',
      'Normalização (1FN, 2FN, 3FN) reduz redundância; desnormalização acelera leitura analítica.',
      'Em analytics, o modelo dimensional (fatos e dimensões / star schema) é o padrão.',
    ],
    aulas: [
      { id: 'm2-a1', titulo: 'Fundamentos de Modelagem de Dados, Tabelas e Relações', videoId: 'SEnnucNP1h0' },
    ],
  },
  {
    id: 'm3',
    titulo: 'Programação para Engenharia de Dados (Python)',
    descricao: 'A linguagem cola da engenharia de dados: scripts, automação e transformação.',
    resumo: [
      'Tipos básicos: int, float, str, bool, além de listas, tuplas, dicionários e sets.',
      'Controle de fluxo com if/elif/else, for e while.',
      'Funções organizam e reaproveitam lógica; módulos e pacotes organizam projetos.',
      'Ecossistema de dados: pandas, PySpark, requests, SQLAlchemy, Airflow.',
      'Ambientes virtuais (venv) isolam dependências de cada projeto.',
    ],
    aulas: [
      { id: 'm3-a1', titulo: 'Introdução Rápida e Prática ao Python em 10 Minutos', videoId: '4p7axLXXBGU' },
    ],
  },
  {
    id: 'm4',
    titulo: 'Infraestrutura em Nuvem (Cloud Computing)',
    descricao: 'Onde os dados vivem hoje: AWS, Azure e GCP.',
    resumo: [
      'Modelos de serviço: IaaS, PaaS e SaaS — quanto você gerencia vs. o provedor.',
      'Elasticidade e pagamento por uso substituem a compra de servidores.',
      'Armazenamento de objetos (S3, Blob Storage, GCS) é a base dos data lakes.',
      'Serviços gerenciados de dados: Redshift/Synapse/BigQuery, Glue/Data Factory/Dataflow.',
      'Regiões, zonas de disponibilidade e IAM (permissões) são conceitos comuns às três nuvens.',
    ],
    aulas: [
      { id: 'm4-a1', titulo: 'Conceitos Fundamentais de Cloud Computing (AWS, Azure, GCP)', videoId: '97l0Ahu2efE' },
    ],
  },
  {
    id: 'm5',
    titulo: 'Pipelines, ETL e Arquitetura de Dados',
    descricao: 'O coração da engenharia de dados: mover, limpar e entregar dados confiáveis.',
    resumo: [
      'ETL: extrai, transforma e depois carrega; ELT: carrega bruto e transforma no destino.',
      'Pipelines podem ser batch (agendados) ou streaming (tempo real).',
      'Arquitetura Medallion: Bronze (bruto) → Silver (limpo e padronizado) → Gold (pronto para negócio).',
      'Orquestradores (Airflow, Dagster, Data Factory) agendam e monitoram as etapas.',
      'Qualidade de dados, idempotência e observabilidade evitam pipelines frágeis.',
    ],
    aulas: [
      { id: 'm5-a1', titulo: 'O que é ETL e Engenharia de Pipelines', videoId: 'ANkrrduTtu0' },
      { id: 'm5-a2', titulo: 'Pipelines na Prática: ETL, ELT e Arquitetura Medallion (Bronze, Silver, Gold)', videoId: 'oSXMIL0xTSQ' },
    ],
  },
  {
    id: 'm6',
    titulo: 'O Topo da Pirâmide: IA Aplicada a Dados (RAG)',
    descricao: 'Conectar LLMs aos seus próprios dados com Retrieval-Augmented Generation.',
    resumo: [
      'LLMs não conhecem seus dados privados nem fatos posteriores ao treino.',
      'RAG recupera trechos relevantes e os injeta no prompt antes da geração.',
      'Etapas: ingestão → chunking → embeddings → banco vetorial → busca → geração.',
      'Bancos vetoriais (pgvector, Pinecone, Chroma) fazem busca por similaridade semântica.',
      'Qualidade do RAG depende da qualidade dos dados: aqui a engenharia de dados faz a diferença.',
    ],
    aulas: [
      { id: 'm6-a1', titulo: 'RAG (Retrieval-Augmented Generation) na Prática', videoId: 'CuPKOGdA46Q' },
    ],
  },
  {
    id: 'm7',
    titulo: 'IA Generativa, Agentes e Criação de Aplicações (AI Builder)',
    descricao: 'De consumidor a construtor: agentes, automações e produtos AI-first.',
    resumo: [
      'Agentes combinam LLM + ferramentas + memória para executar tarefas em várias etapas.',
      'Plataformas no-code/low-code como N8N orquestram fluxos com IA sem muito código.',
      'Aplicações AI-first nascem com a IA no centro do produto, não como acessório.',
      'Boas instruções (prompts), ferramentas bem definidas e avaliação contínua são essenciais.',
      'O engenheiro de dados entrega os dados confiáveis que tornam os agentes úteis.',
    ],
    aulas: [
      { id: 'm7-a1', titulo: 'Masterclass IA Foundations: Agentes, N8N, No-Code e Aplicações AI-First', videoId: 'JQeItPqowOg' },
    ],
  },
]

// Lista plana de aulas, na ordem da trilha, com referência ao módulo.
export const todasAulas = trilha.flatMap((modulo, mi) =>
  modulo.aulas.map((aula, ai) => ({ ...aula, moduloId: modulo.id, moduloIndex: mi, aulaIndex: ai })),
)
