"""Senado Federal: perfis, votações nominais e CEAPS (verba indenizatória).

Fontes:
  https://legis.senado.leg.br/dadosabertos  (senadores, votações)
  https://adm.senado.gov.br/adm-dadosabertos (despesas CEAPS)
"""
import sys
from datetime import timedelta

import common as c

LEG = "https://legis.senado.leg.br/dadosabertos"
ADM = "https://adm.senado.gov.br/adm-dadosabertos/api/v1/senadores/despesas_ceaps"
DIAS = 120


def senadores():
    d = c.get_json(f"{LEG}/senador/lista/atual.json")["ListaParlamentarEmExercicio"]["Parlamentares"]["Parlamentar"]
    saida = []
    for x in d:
        i = x["IdentificacaoParlamentar"]
        saida.append({
            "id": str(i["CodigoParlamentar"]), "nome": i["NomeParlamentar"],
            "partido": i.get("SiglaPartidoParlamentar"), "uf": i.get("UfParlamentar"),
            "foto": (i.get("UrlFotoParlamentar") or "").replace("http://", "https://"),
            "email": i.get("EmailParlamentar"),
        })
    return saida


def ceaps(ano):
    try:
        d = c.get_json(f"{ADM}/{ano}", timeout=300)
    except Exception as e:
        print(f"  CEAPS {ano} indisponível: {e}")
        return {}
    linhas = [(str(x["codSenador"]), int(x["mes"]), x["tipoDespesa"], x["fornecedor"],
               float(x["valorReembolsado"] or 0), None) for x in d]
    return c.resumir_gastos(linhas, None, ano)


def votacoes(existentes):
    ja = {v["id"]: v for v in existentes}
    # a API aceita janelas curtas: busca em blocos de 30 dias
    fim = c.agora().date()
    ini_total = fim - timedelta(days=DIAS)
    cur = ini_total
    novas = 0
    while cur <= fim:
        ate = min(cur + timedelta(days=29), fim)
        try:
            d = c.get_json(f"{LEG}/votacao?dataInicio={cur}&dataFim={ate}")
        except Exception as e:
            print(f"  janela {cur}..{ate} falhou: {e}")
            d = []
        for v in d:
            if not v.get("votos") or v.get("votacaoSecreta") == "S":
                continue
            vid = str(v["codigoSessaoVotacao"])
            if vid in ja:
                continue
            votos = [[str(x["codigoParlamentar"]), x["siglaVotoParlamentar"]] for x in v["votos"]]
            ja[vid] = {
                "id": vid, "casa": "senado", "data": v["dataSessao"], "descricao": v["descricaoVotacao"],
                "aprovacao": {"A": 1, "R": 0}.get(v.get("resultadoVotacao")),
                "sim": sum(1 for _, t in votos if t == "Sim"),
                "nao": sum(1 for _, t in votos if t == "Não"),
                "total": len(votos),
                "proposicao": v.get("identificacao"), "ementa": v.get("ementa"),
                "url": f"https://www25.senado.leg.br/web/atividade/materias/-/materia/{v['codigoMateria']}",
                "votos": votos,
            }
            novas += 1
        cur = ate + timedelta(days=1)
    print(f"  votações nominais novas: {novas}")
    corte = ini_total.isoformat()
    return sorted((v for v in ja.values() if v["data"][:10] >= corte), key=lambda v: v["data"], reverse=True)


def main():
    print("Senado Federal")
    antigo = c.carregar("senado.json", {})
    ano = c.agora().year
    gastos = {str(a): ceaps(a) for a in (ano, ano - 1)}
    pessoas = senadores()
    print(f"  {len(pessoas)} senadores")
    for p in pessoas:
        p["gastos"] = {a: g[p["id"]] for a, g in gastos.items() if p["id"] in g}
    c.salvar("senado.json", {
        "atualizadoEm": c.agora().isoformat(timespec="minutes"),
        "fontes": [LEG, "https://adm.senado.gov.br/adm-dadosabertos"],
        "parlamentares": pessoas, "votacoes": votacoes(antigo.get("votacoes", [])),
    })


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"ERRO Senado: {e}", file=sys.stderr)
        sys.exit(1)
