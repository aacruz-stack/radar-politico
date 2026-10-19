"""ALESP: deputados estaduais e despesas de gabinete (verba de gabinete).

A ALESP não publica votações nominais de plenário em dados abertos (só votações de
comissões); por isso os perfis têm gastos, mas não placar de votos.

Fonte: https://dadosabertos.al.sp.gov.br (CKAN) -> www3.al.sp.gov.br/repositorio/dados-abertos
"""
import sys

import common as c

BASE = "https://www3.al.sp.gov.br/repositorio/dados-abertos/output/json"


def main():
    print("ALESP")
    deps = c.get_json(f"{BASE}/deputados.json")["deputados"]
    pessoas = {}
    for x in deps:
        mat = str(x["matricula"])
        foto = x.get("fotoGrande")
        pessoas[mat] = {
            "id": mat, "nome": x["nomeDeputado"], "partido": x.get("siglaPartido"), "uf": "SP",
            "foto": ("https://www.al.sp.gov.br" + foto) if foto and foto.startswith("/") else foto,
            "email": x.get("email"), "gastos": {},
        }
    print(f"  {len(pessoas)} deputados estaduais")

    ano = c.agora().year
    anos = {str(ano), str(ano - 1)}
    # arquivo grande (histórico desde 2002): carrega e filtra pelos anos de interesse
    bruto = c.get_json(f"{BASE}/despesas_gabinetes.json", timeout=600)
    por_ano = {a: [] for a in anos}
    for d in bruto:
        a = str(d.get("ano"))
        if a in por_ano and d.get("matricula") is not None:
            por_ano[a].append((str(d["matricula"]), int(d.get("mes") or 0),
                               (d.get("tipo") or "").split(" - ", 1)[-1].capitalize(),
                               d.get("fornecedor") or "—", float(d.get("valor") or 0), None))
    del bruto
    for a, linhas in por_ano.items():
        resumo = c.resumir_gastos(linhas, None, a)
        for mat, g in resumo.items():
            if mat in pessoas:
                pessoas[mat]["gastos"][a] = g
    c.salvar("alesp.json", {
        "atualizadoEm": c.agora().isoformat(timespec="minutes"),
        "fontes": ["https://dadosabertos.al.sp.gov.br"],
        "parlamentares": list(pessoas.values()), "votacoes": [],
    })


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"ERRO ALESP: {e}", file=sys.stderr)
        sys.exit(1)
