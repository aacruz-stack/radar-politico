"""Câmara Municipal de São Paulo: vereadores com mandato vigente (web service SPLEGIS).

Gastos: web service SisGV (ObterDebitoVereador, SOAP, parâmetros ano e mes).
PENDENTE (ver README): votos nominais (só via download XML manual na página de Votações do SPLEGIS).
"""
import sys
import unicodedata
import urllib.request
import xml.etree.ElementTree as ET

import common as c

WS = "https://splegisws.saopaulo.sp.leg.br/ws/ws2.asmx"
SISGV = "https://sisgvconsulta.saopaulo.sp.leg.br/ws/Servicos.asmx"
NS = "http://saopaulo.sp.leg.br/sisgv/ws2"


def chave(nome):
    t = unicodedata.normalize("NFD", nome or "")
    return " ".join("".join(ch for ch in t if unicodedata.category(ch) != "Mn").upper().split())


def debitos(ano, mes):
    """Despesas reembolsadas de gabinetes de vereadores (SisGV, SOAP). Lista de (vereador, mes, cat, forn, valor)."""
    corpo = (f'<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">'
             f'<soap:Body><ObterDebitoVereador xmlns="{NS}"><ano>{ano}</ano><mes>{mes}</mes></ObterDebitoVereador>'
             f'</soap:Body></soap:Envelope>').encode("utf-8")
    req = urllib.request.Request(SISGV, data=corpo, headers={
        "Content-Type": "text/xml; charset=utf-8", "SOAPAction": f'"{NS}/ObterDebitoVereador"', "User-Agent": c.UA})
    with urllib.request.urlopen(req, timeout=120) as r:
        raiz = ET.fromstring(r.read())
    saida = []
    for it in raiz.iter(f"{{{NS}}}TabelaPortalITEMREEMBOLSO"):
        g = lambda k: (it.findtext(f"{{{NS}}}{k}") or "").strip()
        if g("TIPODEPARTAMENTO") not in ("", "1"):  # só gabinetes de vereador
            continue
        try:
            valor = float(g("VALOR") or 0)
        except ValueError:
            continue
        saida.append((g("VEREADOR"), mes, g("DESPESA").capitalize(), g("FORNECEDOR"), valor, None))
    return saida


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
    por_chave = {chave(p["nome"]): p for p in pessoas}
    hoje_d = c.agora()
    for ano in (hoje_d.year, hoje_d.year - 1):
        linhas = []
        for mes in range(1, (hoje_d.month if ano == hoje_d.year else 12) + 1):
            try:
                linhas += debitos(ano, mes)
            except Exception as e:
                print(f"  SisGV {ano}-{mes:02d} falhou: {e}")
        # nomes do SisGV sem correspondência no mandato vigente entram assim mesmo (ex.: suplentes, licenciados)
        for nome in {l[0] for l in linhas}:
            if chave(nome) not in por_chave:
                p = {"id": "g-" + chave(nome).replace(" ", "-").lower(), "nome": nome.title(), "partido": None,
                     "uf": "SP", "foto": None, "email": None, "gastos": {}}
                pessoas.append(p)
                por_chave[chave(nome)] = p
        resumo = c.resumir_gastos([(chave(l[0]),) + l[1:] for l in linhas], None, ano)
        for k, g in resumo.items():
            por_chave[k]["gastos"][str(ano)] = g
    pessoas.sort(key=lambda p: p["nome"])
    print(f"  {len(pessoas)} vereadores; com gastos: {sum(1 for p in pessoas if p['gastos'])}")
    c.salvar("cmsp.json", {
        "atualizadoEm": c.agora().isoformat(timespec="minutes"),
        "fontes": ["https://splegisws.saopaulo.sp.leg.br/ws/ws2.asmx", "https://sisgvconsulta.saopaulo.sp.leg.br"],
        "parlamentares": pessoas, "votacoes": [],
    })


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"ERRO CMSP: {e}", file=sys.stderr)
        sys.exit(1)
