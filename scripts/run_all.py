"""Roda todos os coletores. Uma fonte que falha NÃO derruba as outras: os dados antigos dela ficam."""
import json
import subprocess
import sys

import common as c

ETAPAS = [
    ("camara", "collect_camara.py"),
    ("senado", "collect_senado.py"),
    ("alesp", "collect_alesp.py"),
    ("cmsp", "collect_cmsp.py"),
    ("executivo", "collect_executivo.py"),
    ("fichas", "gerar_fichas.py"),
]


def main():
    meta = c.carregar("meta.json", {"fontes": {}})
    for nome, script in ETAPAS:
        r = subprocess.run([sys.executable, f"{c.RAIZ}/scripts/{script}"], capture_output=True, text=True)
        print(r.stdout, end="")
        ok = r.returncode == 0
        if not ok:
            print(r.stderr, file=sys.stderr)
        antigo = meta["fontes"].get(nome, {})
        meta["fontes"][nome] = {
            "ok": ok,
            "ultimaTentativa": c.agora().isoformat(timespec="minutes"),
            "ultimoSucesso": c.agora().isoformat(timespec="minutes") if ok else antigo.get("ultimoSucesso"),
            "erro": None if ok else (r.stderr.strip().splitlines() or ["erro"])[-1][:300],
        }
    meta["atualizadoEm"] = c.agora().isoformat(timespec="minutes")
    c.salvar("meta.json", meta)
    # só falha o job se TODAS as fontes principais falharam
    if not any(meta["fontes"][n]["ok"] for n in ("camara", "senado", "alesp")):
        sys.exit(1)


if __name__ == "__main__":
    main()
