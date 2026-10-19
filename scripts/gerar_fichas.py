"""Gera fichas de lei (resumo rápido + o que faz / quem ganha / quem paga / impacto / dois lados).

Opcional: só roda se ANTHROPIC_API_KEY estiver definida. As fichas são geradas por IA a partir
da ementa oficial e ficam marcadas como tal no site. Limite por execução para controlar custo.
Sem a chave, o site mostra a ementa oficial no lugar do resumo.
"""
import json
import os
import sys
import urllib.request

import common as c

MODELO = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-5-5")
LIMITE = int(os.environ.get("FICHAS_POR_EXECUCAO", "12"))

PROMPT = """Você analisa projetos de lei brasileiros para um site de transparência, em português claro e neutro.
Com base APENAS na proposição abaixo, produza um JSON com estes campos (sem texto fora do JSON):
- "resumo": no máximo 3 linhas, linguagem simples, para quem não tem contexto nenhum: o que a lei faz.
- "oQueFaz": 2-4 frases.
- "quemGanha": quem é beneficiado.
- "quemPaga": quem arca com o custo (Estado, contribuintes, empresas, consumidores...).
- "impacto": impacto provável, sem inventar números.
- "ladoA": o melhor argumento a favor.
- "ladoB": o melhor argumento contra.
Se a ementa não bastar para afirmar algo, diga "não é possível afirmar só pela ementa". Não invente dados.

Proposição: {proposicao}
Ementa oficial: {ementa}
Contexto da votação: {descricao}
Resultado: {resultado}"""


def chamar(chave, texto):
    corpo = json.dumps({"model": MODELO, "max_tokens": 900,
                        "messages": [{"role": "user", "content": texto}]}).encode()
    req = urllib.request.Request("https://api.anthropic.com/v1/messages", data=corpo, headers={
        "x-api-key": chave, "anthropic-version": "2023-06-01", "content-type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        resp = json.load(r)
    txt = "".join(b.get("text", "") for b in resp["content"] if b.get("type") == "text")
    ini, fim = txt.find("{"), txt.rfind("}")
    return json.loads(txt[ini:fim + 1])


def main():
    chave = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if not chave:
        print("Fichas: ANTHROPIC_API_KEY ausente, pulando (o site usa a ementa oficial).")
        return
    fichas = c.carregar("fichas.json", {})
    pendentes = []
    for casa in ("camara", "senado"):
        d = c.carregar(f"{casa}.json", {})
        for v in d.get("votacoes", []):
            k = f"{casa}:{v['id']}"
            if k not in fichas and v.get("ementa"):
                pendentes.append((k, v))
    pendentes.sort(key=lambda kv: kv[1]["data"], reverse=True)
    print(f"Fichas: {len(pendentes)} pendentes, gerando até {LIMITE}")
    feitas = 0
    for k, v in pendentes[:LIMITE]:
        try:
            f = chamar(chave, PROMPT.format(
                proposicao=v.get("proposicao") or "—", ementa=v["ementa"], descricao=v["descricao"],
                resultado={1: "aprovada", 0: "rejeitada"}.get(v.get("aprovacao"), "não informado")))
        except Exception as e:
            print(f"  {k}: falhou ({e})", file=sys.stderr)
            continue
        f["geradoPor"] = f"IA ({MODELO}), a partir da ementa oficial; pode conter imprecisões"
        f["geradoEm"] = c.agora().isoformat(timespec="minutes")
        fichas[k] = f
        feitas += 1
    c.salvar("fichas.json", fichas)
    print(f"  {feitas} fichas novas")


if __name__ == "__main__":
    main()
