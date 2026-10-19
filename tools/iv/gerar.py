"""Gera o conteúdo de IV a partir de biblioteca.py, SEM entregar respostas no que é público:
- public/conteudo/iv/espectros.json   {s<hash>: bandas}            (só bandas; id opaco)
- public/conteudo/iv/estruturas/e<hash>.png                         (preto, sem destaque, nome opaco)
- privado/iv-compostos.json           nomes, funções, fórmulas, ids opacos, bandas e bandasSala
  (bandasSala = mesmas bandas principais com outra impressão digital: o quiz de sala não casa com o espectro de casa)
- ../Aula_IV/quiz_figs/espectro_<id>.png  (para os slides)
- tests/fixtures/iv-amostra.json  (valores de %T para conferir o desenho em JavaScript)
Uso: python3 tools/iv/gerar.py
"""
import hashlib, json, pathlib, shutil, sys
import numpy as np
from rdkit import Chem
from rdkit.Chem import rdMolDescriptors
from rdkit.Chem.Draw import rdMolDraw2D

AQUI = pathlib.Path(__file__).resolve().parent
RAIZ = AQUI.parents[1]
sys.path.insert(0, str(AQUI))
from biblioteca import COMPOSTOS, CANDIDATOS_EXTRA  # noqa: E402

SAIDA = RAIZ / "public/conteudo/iv"
EST = SAIDA / "estruturas"
FIGS = RAIZ.parent / "Aula_IV/quiz_figs"


SAL = "imia-iv-2026"  # muda os ids opacos se precisar
def opaco(prefixo, i):
    return prefixo + hashlib.sha256(f"{SAL}:{prefixo}:{i}".encode()).hexdigest()[:10]


def ruido_digital(seed, n=14, lo=1450, hi=650, amp=0.12):
    """Bandas pequenas na impressão digital (mesmo algoritmo de Aula_IV/build/espectro.py)."""
    rng = np.random.default_rng(seed)
    pos = rng.uniform(hi, lo, n)
    return [(float(p), float(rng.uniform(0.03, amp)), float(rng.uniform(4, 9))) for p in pos]


def transm(x, bandas):
    A = np.zeros_like(x, dtype=float)
    for b in bandas:
        pos, a, hw = b[:3]
        A += a * np.exp(-0.5 * ((x - pos) / hw) ** 2) if (len(b) > 3 and b[3] == "g") else a / (1 + ((x - pos) / hw) ** 2)
    return 100 * 10 ** (-(A + 0.03 + 0.015 * (x - 400) / 3600))


def estrutura(smiles, arq):
    m = Chem.MolFromSmiles(smiles)
    d = rdMolDraw2D.MolDraw2DCairo(600, 380)
    o = d.drawOptions()
    o.useBWAtomPalette()
    o.bondLineWidth = 3
    o.fixedBondLength = 58
    o.padding = 0.1
    o.minFontSize = 26
    o.clearBackground = True
    d.DrawMolecule(m)
    d.FinishDrawing()
    arq.write_bytes(d.GetDrawingText())


def dados(smiles):
    m = Chem.AddHs(Chem.MolFromSmiles(smiles))
    cont = {}
    for a in m.GetAtoms():
        cont[a.GetSymbol()] = cont.get(a.GetSymbol(), 0) + 1
    nC, nH, nN = cont.get("C", 0), cont.get("H", 0), cont.get("N", 0)
    nX = sum(cont.get(x, 0) for x in ("F", "Cl", "Br", "I"))
    ins = nC - (nH + nX) / 2 + nN / 2 + 1
    return rdMolDescriptors.CalcMolFormula(Chem.RemoveHs(m)), nC, int(round(ins))


def figura_espectro(bandas, arq):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    x = np.linspace(4000, 400, 3600)
    fig, ax = plt.subplots(figsize=(10, 3.4), dpi=150)
    ax.plot(x, transm(x, bandas), color="#000099", lw=1.6)
    ax.set_xlim(4000, 400); ax.set_ylim(-3, 105)
    ax.set_xticks([4000, 3500, 3000, 2500, 2000, 1500, 1000, 500]); ax.set_yticks([0, 50, 100])
    ax.set_xlabel("número de onda (cm⁻¹)", fontsize=13); ax.set_ylabel("%T", fontsize=13)
    ax.tick_params(labelsize=12)
    for s in ("top", "right"):
        ax.spines[s].set_visible(False)
    fig.tight_layout(); fig.savefig(arq); plt.close(fig)


def main():
    if EST.exists():
        shutil.rmtree(EST)  # remove PNGs antigos (com nome legível)
    EST.mkdir(parents=True)
    FIGS.mkdir(parents=True, exist_ok=True)
    (SAIDA / "compostos.json").unlink(missing_ok=True)
    meta, espectros = {}, {}
    arred = lambda bs: [[round(v, 2) if isinstance(v, float) else v for v in b] for b in bs]
    for i, c in COMPOSTOS.items():
        bandas = arred([list(b) for b in c["bandas"]] + [list(b) for b in ruido_digital(c["seed"])])
        bandas_sala = arred([list(b) for b in c["bandas"]] + [list(b) for b in ruido_digital(c["seed"] + 1000)])
        formula, nC, ins = dados(c["smiles"])
        est_id, esp_id = opaco("e", i), opaco("s", i)
        meta[i] = dict(id=i, nome=c["nome"], funcao=c["funcao"], familia=c["familia"], formula=formula, nC=nC, insaturacoes=ins,
                       grupo=bool(c["grupo"]), diagnostico=c["diagnostico"], estId=est_id, espId=esp_id, bandas=bandas, bandasSala=bandas_sala)
        espectros[esp_id] = bandas
        estrutura(c["smiles"], EST / f"{est_id}.png")
        figura_espectro(bandas, FIGS / f"espectro_{i}.png")
        figura_espectro(bandas_sala, FIGS / f"espectro_sala_{i}.png")  # o mesmo que o celular mostra no quiz
    extras = {}
    for i, smi in CANDIDATOS_EXTRA.items():
        formula, nC, ins = dados(smi)
        extras[i] = dict(id=i, formula=formula, nC=nC, insaturacoes=ins, estId=opaco("e", i))
        estrutura(smi, EST / f"{extras[i]['estId']}.png")
    (SAIDA / "espectros.json").write_text(json.dumps(dict(sorted(espectros.items()))))
    (RAIZ / "privado").mkdir(exist_ok=True)
    (RAIZ / "privado/iv-compostos.json").write_text(json.dumps({"compostos": meta, "extras": extras}, ensure_ascii=False))
    xs = np.linspace(3900, 500, 20)
    amostra = {meta[i]["espId"]: [[round(float(x), 2), round(float(t), 4)] for x, t in zip(xs, transm(xs, meta[i]["bandas"]))]
               for i in ("2-pentanona", "butironitrila")}
    (RAIZ / "tests/fixtures").mkdir(parents=True, exist_ok=True)
    (RAIZ / "tests/fixtures/iv-amostra.json").write_text(json.dumps({"ids": {"2-pentanona": meta["2-pentanona"]["espId"],
        "butironitrila": meta["butironitrila"]["espId"]}, "pontos": amostra}))
    print(f"{len(meta)} compostos, {len(extras)} extras → {SAIDA} (público opaco) + privado/iv-compostos.json")


if __name__ == "__main__":
    main()
