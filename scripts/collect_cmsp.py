"""Câmara Municipal de São Paulo: vereadores com mandato vigente (web service SPLEGIS).

PENDENTE (ver README): votos nominais (só via download XML manual na página de Votações do
SPLEGIS) e custos de gabinete (web service SisGV, parâmetros não documentados publicamente).
"""
import sys

import common as c

WS = "https://splegisws.saopaulo.sp.leg.br/ws/ws2.asmx"


def main():
    print("Câmara Municipal de SP")
    hoje = c.agora().date().isoformat()
    lista = c.get_json(f"{WS}/VereadoresCMSPJSON")
    pessoas = []
    for v in lista:
        vig = [m for m in v.get("mandatos", []) if m["inicio"][:10] <= hoje <= (m.get("fim") or "9999")[:10]]
        if not vig:
            continue
        partido = ((vig[-1].get("partido") or {}).get("sigla")) or None
        pessoas.append({"id": str(v["chave"]), "nome": v["nome"].title(), "partido": partido, "uf": "SP",
                        "foto": None, "email": None, "gastos": {}})
    pessoas.sort(key=lambda p: p["nome"])
    print(f"  {len(pessoas)} vereadores com mandato vigente")
    c.salvar("cmsp.json", {
        "atualizadoEm": c.agora().isoformat(timespec="minutes"),
        "fontes": ["https://splegisws.saopaulo.sp.leg.br/ws/ws2.asmx"],
        "parlamentares": pessoas, "votacoes": [],
    })


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"ERRO CMSP: {e}", file=sys.stderr)
        sys.exit(1)
