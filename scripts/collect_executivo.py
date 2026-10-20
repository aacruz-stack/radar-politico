"""Executivo: gastos por órgão (os portais não individualizam gasto de Presidente/Governador/Prefeito).

  Prefeitura de SP  -> execução orçamentária (CSV mensal, CKAN dados.prefeitura.sp.gov.br)
  Presidência       -> Portal da Transparência (CPGF e viagens do órgão 20101). EXIGE chave:
                       defina PORTAL_TRANSPARENCIA_KEY (cadastro gratuito por e-mail).
  Governo de SP     -> sem API/CSV estável identificada; ver README ("Fontes que ficaram de fora").
"""
import csv
import html
import json
import io
import os
import re
import subprocess
import sys
import urllib.parse
import urllib.request
from collections import defaultdict

import common as c

CKAN = "https://dados.prefeitura.sp.gov.br/api/3/action/package_show?id=base-dados-execucao"
PORTAL = "https://api.portaldatransparencia.gov.br/api-de-dados"
ORGAO_PLANALTO = "20101"  # Presidência da República (SIAFI)


def num(s):
    try:
        return float((s or "0").replace(".", "").replace(",", ".")) if "," in (s or "") else float(s or 0)
    except ValueError:
        return 0.0


def prefeitura():
    pkg = c.get_json(CKAN)["result"]
    csvs = [r for r in pkg["resources"] if (r.get("format") or "").upper() == "CSV"
            and re.search(r"basedadosexecucao_(\d{2})(\d{2})", r["url"])]

    def chave(r):
        mm, aa = re.search(r"basedadosexecucao_(\d{2})(\d{2})", r["url"]).groups()
        return (int(aa), int(mm))

    mais_nova = max(csvs, key=chave)
    print("  Prefeitura:", mais_nova["url"].rsplit("/", 1)[-1])
    tmp = os.path.join(c.DATA, "_execucao.csv")
    for tentativa in range(3):
        r = subprocess.run(["curl", "-sL", "-m", "240", "--retry", "2", "-A", c.UA, "-o", tmp, mais_nova["url"]])
        if r.returncode == 0 and os.path.exists(tmp) and os.path.getsize(tmp) > 1000:
            break
    else:
        raise RuntimeError("download do CSV da Prefeitura falhou")
    por_orgao = defaultdict(lambda: defaultdict(float))
    ref = None
    with open(tmp, encoding="cp1252", newline="") as f:
        for row in csv.DictReader(f, delimiter=";"):
            o = (row["Sigla_Orgao"], row["Ds_Orgao"])
            a = por_orgao[o]
            a["orcado"] += num(row["Vl_Orcado_Atualizado"])
            a["empenhado"] += num(row["Vl_EmpenhadoLiquido"])
            a["liquidado"] += num(row["Vl_Liquidado"])
            a["pago"] += num(row["Vl_Pago"])
            ref = (row["DataInicial"], row["DataFinal"], row["DataExtracao"])
    os.remove(tmp)
    orgaos = [{"sigla": s, "nome": n, **{k: round(v, 2) for k, v in a.items()}} for (s, n), a in por_orgao.items()]
    orgaos.sort(key=lambda x: -x["pago"])
    return {"periodo": f"{ref[0]} a {ref[1]}" if ref else None, "extraidoEm": ref[2] if ref else None,
            "arquivo": mais_nova["url"], "orgaos": orgaos,
            "orgaoDoPrefeito": next((o for o in orgaos if o["sigla"] == "SGM"), None)}


def portal(chave_api, caminho, params):
    saida, pag = [], 1
    while pag <= 40:
        q = "&".join(f"{k}={v}" for k, v in {**params, "pagina": pag}.items())
        try:
            d = c.get_json(f"{PORTAL}/{caminho}?{q}", headers={"chave-api-dados": chave_api})
        except Exception as e:
            print(f"  Portal {caminho} p{pag}: {e}")
            break
        if not d:
            break
        saida += d
        pag += 1
    return saida


def presidencia():
    chave_api = os.environ.get("PORTAL_TRANSPARENCIA_KEY", "").strip()
    if not chave_api:
        return {"disponivel": False, "motivo": "Chave do Portal da Transparência não configurada."}
    ano = c.agora().year
    ini = f"01/01/{ano}"
    fim = c.agora().strftime("%d/%m/%Y")
    cart = portal(chave_api, "cartoes", {"mesExtratoInicio": f"01/{ano}",
                                         "mesExtratoFim": c.agora().strftime("%m/%Y"),
                                         "codigoOrgao": ORGAO_PLANALTO})
    viag = portal(chave_api, "viagens", {"dataIdaDe": ini, "dataIdaAte": fim, "dataRetornoDe": ini,
                                         "dataRetornoAte": fim, "codigoOrgao": ORGAO_PLANALTO})
    gastos_cartao = [{
        "portador": (x.get("portador") or {}).get("nome"), "estabelecimento": (x.get("estabelecimento") or {}).get("nome"),
        "data": x.get("dataTransacao"), "valor": num(str(x.get("valorTransacao", "0"))),
        "tipo": (x.get("tipoCartao") or {}).get("descricao"),
    } for x in cart]
    viagens = [{
        "pessoa": (x.get("beneficiario") or {}).get("nome") or (x.get("proposto") or {}).get("nome"),
        "motivo": (x.get("viagem") or {}).get("motivo"), "inicio": (x.get("viagem") or {}).get("dataInicioAfastamento"),
        "valor": num(str((x.get("viagem") or {}).get("valorTotalViagem", "0"))),
    } for x in viag] if viag and isinstance(viag[0], dict) and "viagem" in viag[0] else viag
    return {"disponivel": True, "ano": ano,
            "totalCartao": round(sum(g["valor"] for g in gastos_cartao), 2),
            "cartao": sorted(gastos_cartao, key=lambda g: -g["valor"])[:100], "viagens": viagens[:100]}


# Autoridades em exercício. REVISAR quando houver troca de mandato (posse em 01/01/2027 para
# Presidente e Governador, após as eleições de out/2026).
AUTORIDADES = [
    {"id": "presidente", "cargo": "Presidente da República", "nome": "Luiz Inácio Lula da Silva", "partido": "PT",
     "desde": "01/01/2023", "salarioCargo": "Presidente da República", "decretos": "decretosPresidente"},
    {"id": "governador", "cargo": "Governador de São Paulo", "nome": "Tarcísio de Freitas", "partido": "REPUBLICANOS",
     "desde": "01/01/2023", "salarioCargo": "Governador de São Paulo", "decretos": "decretosGovernador"},
    {"id": "prefeito", "cargo": "Prefeito de São Paulo", "nome": "Ricardo Nunes", "partido": "MDB",
     "desde": "16/05/2021", "salarioCargo": "Prefeito de São Paulo", "decretos": "decretosPrefeito"},
]


# ---------------------------------------------------------------- decretos
def decretos_presidente(limite=80):
    """Decretos numerados do ano corrente (API de legislação federal do Senado)."""
    ano = c.agora().year
    d = c.get_json(f"https://legis.senado.leg.br/dadosabertos/legislacao/lista?tipo=DEC&ano={ano}")
    docs = d["ListaDocumento"]["documentos"]["documento"]
    docs = docs if isinstance(docs, list) else [docs]
    saida = [{
        "titulo": x["normaNome"], "data": x["dataassinatura"], "ementa": x.get("ementa"),
        "url": f"https://legis.senado.leg.br/norma/{x['id']}",
    } for x in docs]
    saida.sort(key=lambda x: (x["data"][6:], x["data"][3:5], x["data"][:2]), reverse=True)
    return saida[:limite]


def decretos_governador(limite=80):
    """Decretos do Executivo estadual (normas da ALESP: tipo 3 = Decreto, promulgação 'E').
    O arquivo completo tem 64 MB, mas vem do mais novo para o mais antigo: baixamos só o começo."""
    url = "https://www3.al.sp.gov.br/repositorio/dados-abertos/output/json/normas.json"
    bruto = subprocess.run(["curl", "-sL", "-m", "120", "-r", "0-6000000", "-A", c.UA, url],
                           capture_output=True).stdout.decode("utf-8", "ignore")
    i = bruto.find("[")
    dec_json, ano, saida, pos = json.JSONDecoder(), str(c.agora().year), [], i + 1
    while len(saida) < 4000:
        j = bruto.find("{", pos)
        if j < 0:
            break
        try:
            n, pos = dec_json.raw_decode(bruto, j)
        except ValueError:  # fim do trecho baixado (objeto cortado)
            break
        if n["data"][:4] < ano:
            break
        if n.get("idTipo") == "3" and n.get("promulg") == "E" and n["data"][:4] == ano:
            saida.append(n)
    saida.sort(key=lambda n: (n["data"], int(n["numero"] or 0)), reverse=True)
    return [{
        "titulo": f"Decreto nº {n['numero']}", "data": c_data(n["data"]), "ementa": n.get("ementa"),
        "url": n.get("urlFicha"),
    } for n in saida[:limite]]


def c_data(iso):
    return f"{iso[8:10]}/{iso[5:7]}/{iso[:4]}"


def decretos_prefeito(paginas=6):
    """Decretos municipais (legislacao.prefeitura.sp.gov.br), páginas de 10, mais recentes primeiro."""
    base = "https://legislacao.prefeitura.sp.gov.br"
    ano = c.agora().year
    saida = []
    for pg in range(1, paginas + 1):
        rota = "/busca" if pg == 1 else f"/busca/pg/{pg}"
        url = f"{base}{rota}?ano-inicial={ano}&tipo[]=DECRETO"
        txt = subprocess.run(["curl", "-sL", "-g", "-m", "60", "-A", "Mozilla/5.0 RadarPolitico", url],
                             capture_output=True).stdout.decode("utf-8", "ignore")
        achou = re.findall(r'<div class="bx-resultado">\s*<a href="(/leis/[^"]+)">\s*<h4>(.*?)</h4>\s*<p>(.*?)</p>',
                           txt, re.S)
        if not achou:
            break
        for href, titulo, ementa in achou:
            titulo = html.unescape(re.sub(r"\s+", " ", titulo)).strip()
            m = re.search(r"de (\d{1,2}) de (\w+) de (\d{4})", titulo, re.I)
            meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro",
                     "outubro", "novembro", "dezembro"]
            data = f"{int(m.group(1)):02d}/{meses.index(m.group(2).lower()) + 1:02d}/{m.group(3)}" if m and m.group(2).lower() in meses else None
            saida.append({"titulo": titulo.title().replace(" De ", " de ").replace("Nº", "nº"), "data": data,
                          "ementa": html.unescape(re.sub(r"\s+", " ", ementa)).strip(), "url": base + href})
    return saida


def main():
    print("Executivo")
    antigo = c.carregar("executivo.json", {})
    out = {"atualizadoEm": c.agora().isoformat(timespec="minutes")}
    try:
        out["prefeitura"] = prefeitura()
    except Exception as e:
        print(f"  Prefeitura falhou: {e}", file=sys.stderr)
        out["prefeitura"] = antigo.get("prefeitura")
    try:
        out["presidencia"] = presidencia()
    except Exception as e:
        print(f"  Presidência falhou: {e}", file=sys.stderr)
        out["presidencia"] = antigo.get("presidencia")
    out["autoridades"] = AUTORIDADES
    out["governadorSP"] = {"disponivel": False,
                           "motivo": "O portal transparencia.sp.gov.br não expõe API; a consulta é manual."}
    for chave, fn in (("decretosPresidente", decretos_presidente), ("decretosGovernador", decretos_governador),
                      ("decretosPrefeito", decretos_prefeito)):
        try:
            out[chave] = fn()
            print(f"  {chave}: {len(out[chave])}")
        except Exception as e:
            print(f"  {chave} falhou: {e}", file=sys.stderr)
            out[chave] = antigo.get(chave, [])
    c.salvar("executivo.json", out)


if __name__ == "__main__":
    main()
