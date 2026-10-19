"""Câmara dos Deputados: perfis, votações nominais (plenário) e cota parlamentar (CEAP).

Fontes:
  API   https://dadosabertos.camara.leg.br/api/v2
  CEAP  https://www.camara.leg.br/cotas/Ano-AAAA.csv.zip
"""
import csv
import io
import sys
import zipfile
from datetime import timedelta

import common as c

API = "https://dadosabertos.camara.leg.br/api/v2"
DIAS_VOTACOES = 120
ANOS_CEAP = 2  # ano corrente + anterior
TIPOS_PRINCIPAIS = {"PL", "PLP", "PEC", "MPV", "PDL", "PLN", "PLV", "PRC", "PLC", "PDC"}


def deputados():
    saida, pag = [], 1
    while True:
        d = c.get_json(f"{API}/deputados?itens=100&pagina={pag}&ordem=ASC&ordenarPor=nome")["dados"]
        if not d:
            break
        for x in d:
            saida.append({
                "id": str(x["id"]), "nome": x["nome"], "partido": x["siglaPartido"],
                "uf": x["siglaUf"], "foto": x["urlFoto"], "email": x.get("email"),
            })
        pag += 1
    return saida


def ceap(ano):
    url = f"https://www.camara.leg.br/cotas/Ano-{ano}.csv.zip"
    try:
        bruto = c.get(url, binario=True, timeout=300)
    except Exception as e:
        print(f"  CEAP {ano} indisponível: {e}")
        return {}
    z = zipfile.ZipFile(io.BytesIO(bruto))
    nome = z.namelist()[0]
    texto = io.TextIOWrapper(z.open(nome), encoding="utf-8-sig", newline="")
    linhas = []
    for r in csv.DictReader(texto, delimiter=";"):
        pid = r["ideCadastro"].strip()
        if not pid:  # lideranças/partidos
            continue
        try:
            valor = float(r["vlrLiquido"] or 0)
            mes = int(r["numMes"] or 0)
        except ValueError:
            continue
        linhas.append((pid, mes, r["txtDescricao"].strip().capitalize(), r["txtFornecedor"].strip(),
                       valor, r["urlDocumento"]))
    return c.resumir_gastos(linhas, None, ano)


def votacoes(existentes):
    """Busca só o que ainda não está salvo. Mantém apenas votações com placar nominal."""
    ja = {v["id"]: v for v in existentes}
    ini = (c.agora() - timedelta(days=DIAS_VOTACOES)).date().isoformat()
    fim = c.agora().date().isoformat()
    lista, pag = [], 1
    while True:
        d = c.get_json(f"{API}/votacoes?dataInicio={ini}&dataFim={fim}&itens=100&pagina={pag}"
                       "&ordem=DESC&ordenarPor=dataHoraRegistro")["dados"]
        if not d:
            break
        lista += d
        if len(d) < 100:
            break
        pag += 1
    novas, vistas = 0, set(ja)
    for v in lista:
        if v["siglaOrgao"] != "PLEN":
            continue
        vid = v["id"]
        if vid in ja:
            continue
        try:
            votos = c.get_json(f"{API}/votacoes/{vid}/votos")["dados"]
        except Exception:
            continue
        if not votos:
            # sem placar nominal (votação simbólica): marca como vista para não repetir
            vistas.add(vid)
            continue
        det = c.get_json(f"{API}/votacoes/{vid}")["dados"]
        cands = (det.get("proposicoesAfetadas") or []) + (det.get("objetosPossiveis") or [])
        principais = [o for o in cands if o.get("siglaTipo") in TIPOS_PRINCIPAIS]
        obj = (principais or cands or [{}])[0]
        sim = sum(1 for x in votos if x["tipoVoto"] == "Sim")
        nao = sum(1 for x in votos if x["tipoVoto"] == "Não")
        ja[vid] = {
            "id": vid, "casa": "camara", "data": v["dataHoraRegistro"], "descricao": v["descricao"],
            "aprovacao": v.get("aprovacao"), "sim": sim, "nao": nao, "total": len(votos),
            "proposicao": (f'{obj.get("siglaTipo", "")} {obj.get("numero", "")}/{obj.get("ano", "")}'.strip()
                           if obj.get("id") else None),
            "ementa": obj.get("ementa"),
            "url": f"https://dadosabertos.camara.leg.br/api/v2/votacoes/{vid}",
            "votos": [[str(x["deputado_"]["id"]), x["tipoVoto"]] for x in votos],
        }
        novas += 1
    print(f"  votações nominais novas: {novas}")
    return sorted(ja.values(), key=lambda v: v["data"], reverse=True)


def main():
    print("Câmara dos Deputados")
    antigo = c.carregar("camara.json", {})
    gastos = {}
    ano = c.agora().year
    for a in range(ano, ano - ANOS_CEAP, -1):
        print(f"  CEAP {a}")
        gastos[str(a)] = ceap(a)
    pessoas = deputados()
    print(f"  {len(pessoas)} deputados")
    for p in pessoas:
        p["gastos"] = {a: g[p["id"]] for a, g in gastos.items() if p["id"] in g}
    vots = votacoes(antigo.get("votacoes", []))
    # votações descartadas (>DIAS) saem do arquivo
    corte = (c.agora() - timedelta(days=DIAS_VOTACOES)).date().isoformat()
    vots = [v for v in vots if v["data"][:10] >= corte]
    c.salvar("camara.json", {
        "atualizadoEm": c.agora().isoformat(timespec="minutes"),
        "fontes": ["https://dadosabertos.camara.leg.br/api/v2", "https://www.camara.leg.br/cotas"],
        "parlamentares": pessoas, "votacoes": vots,
    })


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"ERRO Câmara: {e}", file=sys.stderr)
        sys.exit(1)
