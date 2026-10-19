"""Utilitários compartilhados pelos coletores (somente biblioteca padrão)."""
import json
import os
import time
import urllib.error
import urllib.request
from collections import defaultdict
from datetime import datetime, timedelta, timezone

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(RAIZ, "data")
BRT = timezone(timedelta(hours=-3))
UA = "RadarPolitico/2.0 (+https://github.com; dados abertos)"


def agora():
    return datetime.now(BRT)


def get(url, headers=None, tentativas=4, timeout=90, binario=False):
    h = {"User-Agent": UA, "Accept": "application/json"}
    h.update(headers or {})
    ultimo = None
    for i in range(tentativas):
        try:
            req = urllib.request.Request(url, headers=h)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                corpo = r.read()
            return corpo if binario else corpo.decode("utf-8-sig")
        except urllib.error.HTTPError as e:
            if e.code in (400, 401, 403, 404):
                raise
            ultimo = e
        except Exception as e:  # rede instável
            ultimo = e
        time.sleep(2 * (i + 1))
    raise ultimo


def get_json(url, **kw):
    return json.loads(get(url, **kw))


def carregar(nome, padrao=None):
    caminho = os.path.join(DATA, nome)
    if os.path.exists(caminho):
        with open(caminho, encoding="utf-8") as f:
            return json.load(f)
    return padrao


def salvar(nome, obj):
    os.makedirs(DATA, exist_ok=True)
    caminho = os.path.join(DATA, nome)
    with open(caminho, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))
    print(f"  salvo {nome} ({os.path.getsize(caminho) / 1024:.0f} KB)")


def resumir_gastos(linhas, chave_pessoa, ano):
    """linhas: iterável de (pessoa, mes, categoria, fornecedor, valor, doc_url).
    Devolve {pessoa: {total, qtd, porMes[12], porCategoria{}, topFornecedores[]}}."""
    acc = {}
    for pessoa, mes, cat, forn, valor, url in linhas:
        a = acc.setdefault(
            pessoa,
            {"total": 0.0, "qtd": 0, "porMes": [0.0] * 12, "porCategoria": defaultdict(float),
             "fornec": defaultdict(float)},
        )
        a["total"] += valor
        a["qtd"] += 1
        if 1 <= mes <= 12:
            a["porMes"][mes - 1] += valor
        a["porCategoria"][cat or "Outros"] += valor
        a["fornec"][forn or "—"] += valor
    saida = {}
    for pessoa, a in acc.items():
        top = sorted(a["fornec"].items(), key=lambda kv: -kv[1])[:8]
        saida[pessoa] = {
            "total": round(a["total"], 2),
            "qtd": a["qtd"],
            "porMes": [round(x, 2) for x in a["porMes"]],
            "porCategoria": {k: round(v, 2) for k, v in sorted(a["porCategoria"].items(), key=lambda kv: -kv[1])},
            "topFornecedores": [{"nome": n, "valor": round(v, 2)} for n, v in top],
        }
    return saida
