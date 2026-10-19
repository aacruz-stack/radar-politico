"""Executivo: gastos por órgão (os portais não individualizam gasto de Presidente/Governador/Prefeito).

  Prefeitura de SP  -> execução orçamentária (CSV mensal, CKAN dados.prefeitura.sp.gov.br)
  Presidência       -> Portal da Transparência (CPGF e viagens do órgão 20101). EXIGE chave:
                       defina PORTAL_TRANSPARENCIA_KEY (cadastro gratuito por e-mail).
  Governo de SP     -> sem API/CSV estável identificada; ver README ("Fontes que ficaram de fora").
"""
import csv
import io
import os
import re
import sys
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
    req = urllib.request.Request(mais_nova["url"], headers={"User-Agent": c.UA})
    por_orgao = defaultdict(lambda: defaultdict(float))
    ref = None
    with urllib.request.urlopen(req, timeout=600) as r:
        texto = io.TextIOWrapper(r, encoding="cp1252", newline="")
        for row in csv.DictReader(texto, delimiter=";"):
            o = (row["Sigla_Orgao"], row["Ds_Orgao"])
            a = por_orgao[o]
            a["orcado"] += num(row["Vl_Orcado_Atualizado"])
            a["empenhado"] += num(row["Vl_EmpenhadoLiquido"])
            a["liquidado"] += num(row["Vl_Liquidado"])
            a["pago"] += num(row["Vl_Pago"])
            ref = (row["DataInicial"], row["DataFinal"], row["DataExtracao"])
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
    out["governadorSP"] = {"disponivel": False,
                           "motivo": "O portal transparencia.sp.gov.br não expõe API; a consulta é manual."}
    c.salvar("executivo.json", out)


if __name__ == "__main__":
    main()
